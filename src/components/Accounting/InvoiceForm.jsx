import React, { useState, useEffect, useMemo } from "react";
import { useTranslation } from 'react-i18next';
import Card from "@/components/Shared/Card";
import Button from "@/components/Shared/Button";
import Input from "@/components/Shared/Input";
import SearchableSelectBackend from "@/core/SearchableSelectBackend";
import { Save, Plus, Trash2, ArrowLeft } from "lucide-react";

const toNumber = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const resolveId = (value) => {
  if (typeof value === "string") return value;
  if (typeof value === "number") return String(value);
  if (value && typeof value === "object") return value.id || value.uuid || "";
  return "";
};

const buildInvoicePayload = ({
  customerId,
  invoiceDate,
  dueDate,
  isTaxInclusive,
  notes,
  billingAddress,
  warehouseId,
  items,
  includeTaxFlag = true,
  includeNotes = true,
}) => ({
  customer: customerId,
  ...(includeTaxFlag ? { amounts_include_tax: Boolean(isTaxInclusive) } : {}),
  invoice_date: invoiceDate,
  due_date: dueDate,
  ...(includeNotes ? { notes } : {}),
  billing_address: billingAddress || "",
  warehouse: warehouseId,
  lines: items
    .filter((item) => item.catalogItemId && toNumber(item.qty) > 0)
    .map((item) => ({
      sales_catalog_item: item.catalogItemId,
      quantity: String(item.qty),
      ...(item.taxRuleId ? { tax_rule: item.taxRuleId } : {}),
    })),
});

const isInvoicePayloadComplete = (payload) =>
  Boolean(payload.customer) &&
  Boolean(payload.invoice_date) &&
  Boolean(payload.due_date) &&
  Boolean(payload.warehouse) &&
  payload.lines.length > 0;

const EMPTY_LINE = {
  id: 1,
  product: null,
  productId: "",
  catalogItemId: "",
  item: "",
  qty: 1,
  price: 0,
  taxRuleId: "",
  costCenter: "",
  taxAmount: 0,
  total: 0,
};

const mergeById = (base, extras) => {
  const ids = new Set(base.map((o) => o.id));
  return [...base, ...extras.filter((o) => o.id && !ids.has(o.id))];
};

const parseInvoiceLines = (inv) => {
  return (inv.lines || []).map((line, index) => {
    const catItemId = resolveId(line.sales_catalog_item);
    const productId =
      typeof line.sales_catalog_item === "object" && line.sales_catalog_item
        ? resolveId(line.sales_catalog_item.product_id) ||
          resolveId(line.product?.id)
        : resolveId(line.product?.id);
    const productName =
      line.product?.name ||
      (typeof line.sales_catalog_item === "object"
        ? line.sales_catalog_item?.name
        : "") ||
      line.description ||
      "";

    return {
      id: line.id || `${catItemId}-${index}`,
      product: { id: productId, name: productName },
      productId,
      catalogItemId: catItemId,
      item: line.description || productName,
      qty: String(Number(line.quantity ?? 1)),
      price: toNumber(line.unit_price),
      taxRuleId: resolveId(line.tax_rule),
      costCenter: "",
      taxAmount: toNumber(line.line_tax),
      total: toNumber(line.line_gross ?? line.line_net),
      net: toNumber(line.line_net),
    };
  });
};

const extractOptionsFromInvoice = (inv) => {
  const customers = [];
  if (inv.customer) {
    customers.push({
      id: resolveId(inv.customer),
      name:
        inv.customer_name ||
        (typeof inv.customer === "object" ? inv.customer.name : "") ||
        "Customer",
      contactPerson: "",
      email: "",
      phone: "",
      currencyCode: inv.currency || "",
    });
  }

  const warehouses = [];
  if (inv.warehouse) {
    warehouses.push({
      id: resolveId(inv.warehouse),
      name:
        inv.warehouse_name ||
        (typeof inv.warehouse === "object" ? inv.warehouse.name : "") ||
        inv.warehouse_display?.name ||
        "Warehouse",
      location: "",
    });
  }

  const products = [];
  const taxRules = [];
  (inv.lines || []).forEach((line) => {
    const catItemId = resolveId(line.sales_catalog_item);
    const productId =
      typeof line.sales_catalog_item === "object" && line.sales_catalog_item
        ? resolveId(line.sales_catalog_item.product_id) ||
          resolveId(line.product?.id)
        : resolveId(line.product?.id);
    const productName =
      line.product?.name ||
      (typeof line.sales_catalog_item === "object"
        ? line.sales_catalog_item?.name
        : "") ||
      line.description ||
      "";

    if (catItemId) {
      products.push({
        id: catItemId,
        productId: productId || catItemId,
        name: productName || "Invoice item",
        sku: "",
        price: toNumber(
          line.unit_price ??
            (typeof line.sales_catalog_item === "object"
              ? line.sales_catalog_item?.selling_price
              : 0),
        ),
        description: line.description || productName,
        taxRuleId: resolveId(line.tax_rule) || "",
        taxRuleName: "",
      });
    }

    const taxId = resolveId(line.tax_rule);
    if (taxId) {
      const taxName =
        typeof line.tax_rule === "object" ? line.tax_rule.name : "";
      const lineNet = toNumber(line.line_net);
      const lineTax = toNumber(line.line_tax);
      taxRules.push({
        id: taxId,
        name: taxName || "Tax rule",
        rate: lineNet > 0 ? (lineTax / lineNet) * 100 : 0,
      });
    }
  });

  return { customers, warehouses, products, taxRules };
};

const InvoiceForm = ({
  customerOptions = [],
  productOptions = [],
  warehouseOptions = [],
  taxOptions = [],
  customerPagination,
  productPagination,
  warehousePagination,
  taxPagination,
  initialInvoice,
  onSubmit,
  onCancel,
  isSubmitting = false,
  showHeader = false,
  headerTitle,
  headerSubtitle,
  submitLabel,
  showAddCustomerButton = false,
  onAddCustomer,
  showNotes = true,
  dropdownZIndexBase = 0,
}) => {
  const zCustomer = dropdownZIndexBase + 1200;
  const zWarehouse = dropdownZIndexBase + 1150;
  const zProduct = dropdownZIndexBase + 4000;
  const zTax = dropdownZIndexBase + 3900;
  const isEditMode = Boolean(initialInvoice);

  const [customerId, setCustomerId] = useState(() =>
    initialInvoice ? resolveId(initialInvoice.customer) : "",
  );
  const [invoiceDate, setInvoiceDate] = useState(() =>
    initialInvoice?.invoice_date || new Date().toISOString().split("T")[0],
  );
  const [dueDate, setDueDate] = useState(() =>
    initialInvoice?.due_date || "",
  );
  const [isTaxInclusive, setIsTaxInclusive] = useState(() =>
    initialInvoice ? Boolean(initialInvoice.amounts_include_tax) : false,
  );
  const [notes, setNotes] = useState(() => initialInvoice?.notes || "");
  const [billingAddress, setBillingAddress] = useState(() =>
    initialInvoice?.billing_address || "",
  );
  const [warehouseId, setWarehouseId] = useState(() =>
    initialInvoice ? resolveId(initialInvoice.warehouse) : "",
  );
  const [items, setItems] = useState(() => {
    if (initialInvoice) {
      const parsed = parseInvoiceLines(initialInvoice);
      return parsed.length ? parsed : [{ ...EMPTY_LINE }];
    }
    return [{ ...EMPTY_LINE }];
  });
  const [initialPayload, setInitialPayload] = useState(() => {
    if (!initialInvoice) return null;
    const parsed = parseInvoiceLines(initialInvoice);
    const initItems = parsed.length ? parsed : [{ ...EMPTY_LINE }];
    return buildInvoicePayload({
      customerId: resolveId(initialInvoice.customer),
      invoiceDate: initialInvoice.invoice_date || "",
      dueDate: initialInvoice.due_date || "",
      isTaxInclusive: Boolean(initialInvoice.amounts_include_tax),
      notes: initialInvoice.notes || "",
      billingAddress: initialInvoice.billing_address || "",
      warehouseId: resolveId(initialInvoice.warehouse),
      items: initItems,
      includeNotes: showNotes,
    });
  });
  const [invoiceExtras, setInvoiceExtras] = useState(() =>
    initialInvoice
      ? extractOptionsFromInvoice(initialInvoice)
      : { customers: [], warehouses: [], products: [], taxRules: [] },
  );
  const mergedCustomerOptions = useMemo(
    () => mergeById(customerOptions, invoiceExtras.customers),
    [customerOptions, invoiceExtras.customers],
  );
  const mergedProductOptions = useMemo(
    () => mergeById(productOptions, invoiceExtras.products),
    [productOptions, invoiceExtras.products],
  );
  const mergedWarehouseOptions = useMemo(
    () => mergeById(warehouseOptions, invoiceExtras.warehouses),
    [warehouseOptions, invoiceExtras.warehouses],
  );
  const mergedTaxOptions = useMemo(
    () => mergeById(taxOptions, invoiceExtras.taxRules),
    [taxOptions, invoiceExtras.taxRules],
  );

  useEffect(() => {
    if (!initialInvoice) return;
    const inv = initialInvoice;
    const populatedItems = parseInvoiceLines(inv);
    const finalItems = populatedItems.length
      ? populatedItems
      : [{ ...EMPTY_LINE }];

    setCustomerId(resolveId(inv.customer));
    setInvoiceDate(inv.invoice_date || "");
    setDueDate(inv.due_date || "");
    setIsTaxInclusive(Boolean(inv.amounts_include_tax));
    setNotes(inv.notes || "");
    setBillingAddress(inv.billing_address || "");
    setWarehouseId(resolveId(inv.warehouse));
    setItems(finalItems);
    setInvoiceExtras(extractOptionsFromInvoice(inv));
    setInitialPayload(
      buildInvoicePayload({
        customerId: resolveId(inv.customer),
        invoiceDate: inv.invoice_date || "",
        dueDate: inv.due_date || "",
        isTaxInclusive: Boolean(inv.amounts_include_tax),
        notes: inv.notes || "",
        billingAddress: inv.billing_address || "",
        warehouseId: resolveId(inv.warehouse),
        items: finalItems,
        includeNotes: showNotes,
      }),
    );
  }, [initialInvoice, showNotes]);

  const taxRateById = useMemo(() => {
    return new Map(
      mergedTaxOptions.map((rule) => [rule.id, toNumber(rule.rate)]),
    );
  }, [mergedTaxOptions]);

  const calculateTax = (amount, taxRuleId, isInclusive = false) => {
    const ratePercent = taxRateById.get(taxRuleId) || 0;
    const rate = ratePercent / 100;
    if (!rate) return { net: amount, tax: 0, total: amount, rate: 0 };
    if (isInclusive) {
      const net = amount / (1 + rate);
      const tax = amount - net;
      return { net, tax, total: amount, rate: ratePercent };
    }
    const tax = amount * rate;
    return { net: amount, tax, total: amount + tax, rate: ratePercent };
  };

  useEffect(() => {
    setItems((currentItems) => {
      const updatedItems = currentItems.map((item) => {
        const lineAmount = toNumber(item.qty) * toNumber(item.price);
        const taxResult = calculateTax(
          lineAmount,
          item.taxRuleId,
          isTaxInclusive,
        );
        return {
          ...item,
          taxAmount: taxResult.tax,
          total: taxResult.total,
          net: taxResult.net,
        };
      });
      return JSON.stringify(updatedItems) !== JSON.stringify(currentItems)
        ? updatedItems
        : currentItems;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    isTaxInclusive,
    taxRateById,
    items.map((i) => `${i.qty}-${i.price}-${i.taxRuleId}`).join(","),
  ]);

  useEffect(() => {
    if (!mergedProductOptions.length) return;
    setItems((prev) =>
      prev.map((line) => {
        if (line.catalogItemId || !line.productId) return line;
        const matched = mergedProductOptions.find(
          (p) => p.productId === line.productId,
        );
        if (!matched) return line;
        return {
          ...line,
          product: line.product || {
            id: matched.productId || "",
            name: matched.name || "",
          },
          catalogItemId: matched.id,
          item: line.item || matched.name || matched.description || "",
          price: toNumber(line.price) || matched.price,
          taxRuleId: line.taxRuleId || matched.taxRuleId || "",
        };
      }),
    );
  }, [mergedProductOptions]);

  const addItem = () => {
    setItems([...items, { ...EMPTY_LINE, id: Date.now() }]);
  };

  const removeItem = (id) => {
    if (items.length > 1) setItems(items.filter((i) => i.id !== id));
  };

  const updateItem = (id, field, value) => {
    setItems((prev) =>
      prev.map((i) => (i.id === id ? { ...i, [field]: value } : i)),
    );
  };

  const subtotal = items.reduce(
    (sum, item) =>
      sum +
      (isTaxInclusive
        ? toNumber(item.net)
        : toNumber(item.qty) * toNumber(item.price)),
    0,
  );
  const taxTotal = items.reduce(
    (sum, item) => sum + toNumber(item.taxAmount),
    0,
  );
  const grandTotal = items.reduce((sum, item) => sum + toNumber(item.total), 0);

  const invoicePayload = useMemo(
    () =>
      buildInvoicePayload({
        customerId,
        invoiceDate,
        dueDate,
        isTaxInclusive,
        notes,
        billingAddress,
        warehouseId,
        items,
        includeTaxFlag: isEditMode || isTaxInclusive,
        includeNotes: showNotes,
      }),
    [
      billingAddress,
      customerId,
      dueDate,
      invoiceDate,
      isEditMode,
      isTaxInclusive,
      items,
      notes,
      showNotes,
      warehouseId,
    ],
  );

  const isFormComplete = isInvoicePayloadComplete(invoicePayload);
  const hasChanges =
    !isEditMode ||
    JSON.stringify(invoicePayload) !== JSON.stringify(initialPayload);
  const isSubmitDisabled =
    isSubmitting || !isFormComplete || (isEditMode && !hasChanges);

  const generatedInvoiceNumber = useMemo(
    () => `INV-${new Date().getFullYear()}-${String(Date.now()).slice(-4)}`,
    [],
  );

  const handleSubmit = () => {
    if (!isFormComplete) return;
    if (isEditMode && !hasChanges) return;
    onSubmit?.(invoicePayload);
  };

  const pag = (p) => p || {};

  return (
    <div className="create-invoice-page">
      {showHeader && (
        <div className="create-invoice-header">
          <Button
            variant="ghost"
            icon={<ArrowLeft size={18} />}
            onClick={onCancel}
            className="cursor-pointer shrink-0"
          />
          <div>
            <h1 style={{ fontSize: "1.75rem", fontWeight: 700 }}>
              {headerTitle || (isEditMode ? "Edit Invoice" : "Create Invoice")}
            </h1>
            {headerSubtitle && (
              <p style={{ color: "var(--color-text-secondary)" }}>
                {headerSubtitle}
              </p>
            )}
          </div>
        </div>
      )}

      <Card
        className="padding-lg create-invoice-card"
        style={{ overflow: "visible" }}
      >
        <div className="invoice-details-grid">
          <div
            style={{ display: "flex", flexDirection: "column", gap: "1rem" }}
          >
            <h3 style={{ fontSize: "1.1rem", fontWeight: 600 }}>
              Customer Details
            </h3>
            <div
              className="customer-select-grid"
              style={
                showAddCustomerButton
                  ? undefined
                  : { gridTemplateColumns: "minmax(0, 1fr)" }
              }
            >
              <div
                style={{
                  minWidth: 0,
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.5rem",
                }}
              >
                <label style={{ fontSize: "0.875rem", fontWeight: 500 }}>
                  Customer Name
                </label>
                <SearchableSelectBackend
                  value={customerId}
                  options={mergedCustomerOptions}
                  searchTerm={pag(customerPagination).searchTerm || ""}
                  onSearchChange={pag(customerPagination).onSearchChange}
                  onChange={(v) => setCustomerId(v)}
                  placeholder="Search customer..."
                  emptyLabel={
                    pag(customerPagination).isLoading
                      ? "Loading customers..."
                      : "No customers found"
                  }
                  getOptionLabel={(o) =>
                    [o.name, o.email, o.currencyCode]
                      .filter(Boolean)
                      .join(" - ")
                  }
                  getOptionValue={(o) => o.id}
                  hasMore={pag(customerPagination).hasMore || false}
                  onLoadMore={pag(customerPagination).onLoadMore}
                  isLoadingMore={pag(customerPagination).isLoadingMore || false}
                  isInitialLoading={pag(customerPagination).isLoading || false}
                  paginationError={pag(customerPagination).error || ""}
                  zIndex={zCustomer}
                />
              </div>
              {showAddCustomerButton && (
                <Button
                  variant="outline"
                  style={{
                    width: "2.5rem",
                    padding: 0,
                    justifyContent: "center",
                  }}
                  title="Add New Customer"
                  onClick={onAddCustomer}
                >
                  <Plus size={18} />
                </Button>
              )}
            </div>
            <Input
              label="Billing Address"
              placeholder="Street, City, Country"
              value={billingAddress}
              onChange={(e) => setBillingAddress(e.target.value)}
            />
            <SearchableSelectBackend
              label="Warehouse"
              value={warehouseId}
              options={mergedWarehouseOptions}
              searchTerm={pag(warehousePagination).searchTerm || ""}
              onSearchChange={pag(warehousePagination).onSearchChange}
              onChange={(v) => setWarehouseId(v)}
              placeholder="Search warehouse..."
              emptyLabel={
                pag(warehousePagination).isLoading
                  ? "Loading warehouses..."
                  : "No warehouses found"
              }
              getOptionLabel={(o) =>
                [o.name, o.location].filter(Boolean).join(" - ")
              }
              getOptionValue={(o) => o.id}
              hasMore={pag(warehousePagination).hasMore || false}
              onLoadMore={pag(warehousePagination).onLoadMore}
              isLoadingMore={pag(warehousePagination).isLoadingMore || false}
              isInitialLoading={pag(warehousePagination).isLoading || false}
              paginationError={pag(warehousePagination).error || ""}
              zIndex={zWarehouse}
            />
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                marginTop: "0.5rem",
              }}
            >
              <input
                type="checkbox"
                id="taxInclusive"
                checked={isTaxInclusive}
                onChange={(e) => setIsTaxInclusive(e.target.checked)}
                style={{ width: "1rem", height: "1rem" }}
              />
              <label
                htmlFor="taxInclusive"
                style={{
                  fontSize: "0.9rem",
                  fontWeight: 500,
                  cursor: "pointer",
                }}
              >
                Amounts include tax
              </label>
            </div>
          </div>
          <div
            style={{ display: "flex", flexDirection: "column", gap: "1rem" }}
          >
            <h3 style={{ fontSize: "1.1rem", fontWeight: 600 }}>
              Invoice Details
            </h3>
            <div className="invoice-date-grid">
              <Input
                label="Invoice Date"
                type="date"
                value={invoiceDate}
                onChange={(e) => setInvoiceDate(e.target.value)}
              />
              <Input
                label="Due Date"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </div>
            <Input
              label="Invoice Number"
              value={
                initialInvoice?.number ||
                (isEditMode ? "" : generatedInvoiceNumber)
              }
              readOnly
            />
            {showNotes && (
              <Input
                label="Notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add invoice notes..."
              />
            )}
          </div>
        </div>

        <div
          className="invoice-lines"
          style={{ position: "relative", zIndex: 20 }}
        >
          <div className="invoice-lines-header">
            <span>Product</span>
            <span>Item Description</span>
            <span style={{ textAlign: "center" }}>Qty</span>
            <span style={{ textAlign: "right" }}>Price</span>
            <span>Tax Rule</span>
            <span style={{ textAlign: "right" }}>Total</span>
            <span aria-hidden="true" />
          </div>
          <div className="invoice-lines-body">
            {items.map((item) => (
              <div key={item.id} className="invoice-line-row">
                <div
                  className="invoice-line-field invoice-line-product"
                  data-label="Product"
                >
                  <div className="invoice-mobile-label">Product</div>
                  <div style={{ minWidth: 0 }}>
                    <SearchableSelectBackend
                      value={item.catalogItemId}
                      options={mergedProductOptions}
                      searchTerm={pag(productPagination).searchTerm || ""}
                      onSearchChange={pag(productPagination).onSearchChange}
                      onChange={(nextValue, selectedProduct) => {
                        setItems((prev) =>
                          prev.map((i) =>
                            i.id === item.id
                              ? {
                                  ...i,
                                  product: selectedProduct
                                    ? {
                                        id:
                                          selectedProduct?.productId ||
                                          nextValue,
                                        name: selectedProduct?.name || "",
                                      }
                                    : null,
                                  productId:
                                    selectedProduct?.productId || nextValue,
                                  catalogItemId: nextValue,
                                  item:
                                    selectedProduct?.name ||
                                    selectedProduct?.description ||
                                    "",
                                  price: selectedProduct?.price ?? i.price,
                                  taxRuleId:
                                    selectedProduct?.taxRuleId || i.taxRuleId,
                                }
                              : i,
                          ),
                        );
                      }}
                      placeholder="Search product..."
                      emptyLabel={
                        pag(productPagination).isLoading
                          ? "Loading items..."
                          : "No items found"
                      }
                      getOptionLabel={(o) =>
                        [
                          o.name,
                          o.sku ? `SKU: ${o.sku}` : "",
                          `${toNumber(o.price).toFixed(2)}`,
                        ]
                          .filter(Boolean)
                          .join(" - ")
                      }
                      getOptionValue={(o) => o.id}
                      hasMore={pag(productPagination).hasMore || false}
                      onLoadMore={pag(productPagination).onLoadMore}
                      isLoadingMore={
                        pag(productPagination).isLoadingMore || false
                      }
                      isInitialLoading={
                        pag(productPagination).isLoading || false
                      }
                      paginationError={pag(productPagination).error || ""}
                      zIndex={zProduct}
                    />
                  </div>
                </div>
                <div
                  className="invoice-line-field invoice-line-item"
                  data-label="Item Description"
                >
                  <div className="invoice-mobile-label">Item Description</div>
                  <div style={{ minWidth: 0 }}>
                    <Input
                      value={item.product?.name || item.item || ""}
                      readOnly
                      placeholder="Description"
                    />
                  </div>
                </div>
                <div className="invoice-line-field" data-label="Qty">
                  <div className="invoice-mobile-label">Qty</div>
                  <div style={{ minWidth: 0 }}>
                    <Input
                      type="number"
                      min="1"
                      value={item.qty}
                      onChange={(e) =>
                        updateItem(item.id, "qty", e.target.value)
                      }
                      style={{ textAlign: "center" }}
                    />
                  </div>
                </div>
                <div className="invoice-line-field" data-label="Price">
                  <div className="invoice-mobile-label">Price</div>
                  <div style={{ minWidth: 0 }}>
                    <Input
                      type="number"
                      min="0"
                      value={item.price}
                      readOnly
                      style={{ textAlign: "right" }}
                    />
                  </div>
                </div>
                <div
                  className="invoice-line-field invoice-line-tax"
                  data-label="Tax Rule"
                >
                  <div className="invoice-mobile-label">Tax Rule</div>
                  <div style={{ minWidth: 0 }}>
                    <SearchableSelectBackend
                      value={item.taxRuleId}
                      options={mergedTaxOptions}
                      searchTerm={pag(taxPagination).searchTerm || ""}
                      onSearchChange={pag(taxPagination).onSearchChange}
                      onChange={(v) => updateItem(item.id, "taxRuleId", v)}
                      placeholder="No tax"
                      emptyLabel={
                        pag(taxPagination).isLoading
                          ? "Loading tax rules..."
                          : "No tax rules found"
                      }
                      getOptionLabel={(o) =>
                        `${o.name} (${toNumber(o.rate).toFixed(2)}%)`
                      }
                      getOptionValue={(o) => o.id}
                      hasMore={pag(taxPagination).hasMore || false}
                      onLoadMore={pag(taxPagination).onLoadMore}
                      isLoadingMore={pag(taxPagination).isLoadingMore || false}
                      isInitialLoading={pag(taxPagination).isLoading || false}
                      paginationError={pag(taxPagination).error || ""}
                      zIndex={zTax}
                    />
                  </div>
                </div>
                <div className="invoice-line-total" data-label="Total">
                  <div className="invoice-mobile-label">Total</div>
                  <div>
                    <div style={{ fontWeight: 600 }}>
                      ${item.total.toFixed(2)}
                    </div>
                    <div
                      style={{
                        fontSize: "0.75rem",
                        color: "var(--color-text-secondary)",
                      }}
                    >
                      (Tax: ${item.taxAmount.toFixed(2)})
                    </div>
                  </div>
                </div>
                <div className="invoice-line-remove">
                  <button
                    onClick={() => removeItem(item.id)}
                    style={{
                      color: "var(--color-error)",
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                    }}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <Button variant="outline" icon={<Plus size={16} />} onClick={addItem}>
          Add Item
        </Button>

        <div className="invoice-totals">
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              width: "min(100%, 250px)",
              fontSize: "0.9rem",
            }}
          >
            <span style={{ color: "var(--color-text-secondary)" }}>
              Subtotal (Net):
            </span>
            <span>${subtotal.toFixed(2)}</span>
          </div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              width: "min(100%, 250px)",
              fontSize: "0.9rem",
            }}
          >
            <span style={{ color: "var(--color-text-secondary)" }}>
              Total Tax:
            </span>
            <span>${taxTotal.toFixed(2)}</span>
          </div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              width: "min(100%, 250px)",
              fontSize: "1.25rem",
              fontWeight: 700,
              borderTop: "1px solid var(--color-border)",
              paddingTop: "0.5rem",
              marginTop: "0.5rem",
            }}
          >
            <span>Grand Total:</span>
            <span style={{ color: "var(--color-primary-600)" }}>
              ${grandTotal.toFixed(2)}
            </span>
          </div>
          <div className="invoice-actions">
            <Button variant="ghost" onClick={onCancel}>
              Cancel
            </Button>
            <Button
              icon={<Save size={18} />}
              onClick={handleSubmit}
              disabled={isSubmitDisabled}
              isLoading={isSubmitting}
              title={
                !isFormComplete
                  ? "Complete required invoice fields first."
                  : isEditMode && !hasChanges
                    ? "No invoice changes to save."
                    : undefined
              }
            >
              {submitLabel || (isEditMode ? "Save Changes" : "Send Invoice")}
            </Button>
          </div>
        </div>
      </Card>

      <style>{`
                .create-invoice-page {
                    display: flex;
                    flex-direction: column;
                    gap: 2rem;
                    width: 100%;
                    max-width: 1400px;
                    min-width: 0;
                    margin: 0 auto;
                }
                .create-invoice-header {
                    display: flex;
                    align-items: center;
                    gap: 1rem;
                    min-width: 0;
                }
                .create-invoice-header > div { min-width: 0; }
                .invoice-details-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(min(100%, 280px), 1fr));
                    gap: 2rem;
                    margin-bottom: 2rem;
                    min-width: 0;
                }
                .customer-select-grid {
                    display: grid;
                    grid-template-columns: minmax(0, 1fr) auto;
                    align-items: end;
                    gap: 0.5rem;
                }
                .invoice-date-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(min(100%, 150px), 1fr));
                    gap: 1rem;
                    min-width: 0;
                }
                .invoice-lines {
                    display: grid;
                    gap: 0;
                    margin-bottom: 1.5rem;
                    min-width: 0;
                    overflow: visible;
                }
                .invoice-lines-header,
                .invoice-line-row {
                    display: grid;
                    grid-template-columns: minmax(0, 1.6fr) minmax(0, 1.7fr) minmax(4.5rem, 0.6fr) minmax(6rem, 0.8fr) minmax(0, 1.2fr) minmax(6.5rem, 0.8fr) 2.5rem;
                    gap: 0.75rem;
                    align-items: center;
                    min-width: 0;
                }
                .invoice-lines-header {
                    padding: 0.5rem;
                    border-bottom: 1px solid var(--color-border);
                    color: var(--color-text-muted);
                    font-size: 0.85rem;
                    font-weight: 600;
                }
                .invoice-line-row {
                    padding: 0.5rem;
                    border-bottom: 1px solid var(--color-border);
                }
                .invoice-line-field,
                .invoice-line-total,
                .invoice-line-remove { min-width: 0; }
                .invoice-line-field {
                    position: relative;
                    z-index: 1;
                    overflow: visible;
                }
                .invoice-line-total { text-align: right; }
                .invoice-line-remove { text-align: center; }
                .invoice-mobile-label {
                    display: none;
                    color: var(--color-text-muted);
                    font-size: 0.75rem;
                    font-weight: 600;
                }
                .invoice-totals {
                    margin-top: 2rem;
                    display: flex;
                    flex-direction: column;
                    align-items: flex-end;
                    gap: 0.5rem;
                    min-width: 0;
                }
                .invoice-actions {
                    margin-top: 1.5rem;
                    display: flex;
                    flex-wrap: wrap;
                    justify-content: flex-end;
                    gap: 1rem;
                }
                @media (max-width: 700px) {
                    .create-invoice-page { gap: 1.25rem; }
                    .create-invoice-card { padding: 1rem !important; }
                    .create-invoice-header { align-items: flex-start; }
                    .create-invoice-header h1 { font-size: 1.45rem !important; }
                    .invoice-details-grid { gap: 1.5rem; }
                    .invoice-lines-header { display: none; }
                    .invoice-lines { overflow: visible; padding-bottom: 0; }
                    .invoice-lines-body { display: grid; gap: 1rem; }
                    .invoice-line-row {
                        grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
                        gap: 0.875rem;
                        min-width: 0;
                        padding: 1rem;
                        border: 1px solid var(--color-border);
                        border-radius: 0.75rem;
                        background: var(--color-bg-surface);
                    }
                    .invoice-line-field, .invoice-line-total { display: grid; gap: 0.375rem; }
                    .invoice-line-item, .invoice-line-product, .invoice-line-tax, .invoice-line-total { grid-column: 1 / -1; }
                    .invoice-line-total { grid-template-columns: 1fr auto; align-items: center; text-align: right; }
                    .invoice-line-remove { grid-column: 1 / -1; text-align: right; }
                    .invoice-mobile-label { display: block; }
                    .invoice-totals { align-items: stretch; }
                    .invoice-actions { justify-content: stretch; }
                    .invoice-actions > * { flex: 1 1 10rem; }
                }
                @media (max-width: 420px) {
                    .customer-select-grid, .invoice-line-row { grid-template-columns: minmax(0, 1fr); }
                    .customer-select-grid > button { width: 100% !important; }
                    .invoice-line-total { grid-template-columns: minmax(0, 1fr); text-align: left; }
                }
            `}</style>
    </div>
  );
};

export default InvoiceForm;
