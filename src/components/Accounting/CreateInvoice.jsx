import React, { useState, useEffect, useMemo } from "react";
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from "react-router-dom";
import { useBasePath } from "@/hooks/useBasePath";
import { useAccounting } from "@/context/AccountingContext";
import useCustomQuery from "@/hooks/useQuery";
import { useCustomPatch, useCustomPost } from "@/hooks/useMutation";
import Spinner from "@/core/Spinner";
import Button from "@/components/Shared/Button";
import Card from "@/components/Shared/Card";
import InvoiceForm from "@/components/Accounting/InvoiceForm";
import { ArrowLeft } from "lucide-react";
import { getApiErrorMessage } from "@/utils/apiErrorMessage";
import { toast } from "sonner";

const normalizePagedResponse = (response, nestedKey) => {
  const rawData = response?.data;
  if (Array.isArray(rawData))
    return { items: rawData, hasMore: Boolean(response?.next) };
  if (nestedKey && Array.isArray(rawData?.[nestedKey]))
    return { items: rawData[nestedKey], hasMore: Boolean(response?.next) };
  if (Array.isArray(response?.results))
    return { items: response.results, hasMore: Boolean(response?.next) };
  if (Array.isArray(response)) return { items: response, hasMore: false };
  return { items: [], hasMore: false };
};

const mergeUniqueById = (previousItems, nextItems, page) => {
  if (page === 1) return nextItems;
  const existingIds = new Set(previousItems.map((item) => item.id));
  return [
    ...previousItems,
    ...nextItems.filter((item) => !existingIds.has(item.id)),
  ];
};

const toNumber = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const normalizeCatalogItems = (response) =>
  normalizePagedResponse(response).items.map((catalogItem) => {
    const item = catalogItem?.item || catalogItem?.product || catalogItem;
    const taxRule = catalogItem?.tax_rule || item?.tax_rule || {};
    const resolvedProductId =
      catalogItem?.product_id || item?.product_id || catalogItem?.id;
    return {
      id: catalogItem.id,
      productId: resolvedProductId,
      name:
        item?.name ||
        catalogItem.name ||
        catalogItem.description ||
        "Unnamed item",
      sku: item?.sku || catalogItem.sku || "",
      price: toNumber(
        catalogItem.selling_price ??
          catalogItem.unit_price ??
          item?.selling_price ??
          item?.cost_price,
      ),
      description:
        catalogItem.description || item?.description || item?.name || "",
      taxRuleId: taxRule?.id || "",
      taxRuleName: taxRule?.name || "",
      stock: item?.total_stock,
    };
  });

const normalizeWarehouses = (response) =>
  normalizePagedResponse(response).items.map((warehouse) => ({
    id: warehouse.id,
    name: warehouse.name || "Unnamed warehouse",
    location: warehouse.location || "",
  }));

const CreateInvoice = () => {
  const navigate = useNavigate();
  const basePath = useBasePath();
  const { id: invoiceId } = useParams();
  const { taxRules: contextTaxRules } = useAccounting();
  const isEditMode = Boolean(invoiceId);
  const invoicesRoute = `${basePath}/accounting/invoices`;

  const [customerSearchTerm, setCustomerSearchTerm] = useState("");
  const [customerPage, setCustomerPage] = useState(1);
  const [customerOptions, setCustomerOptions] = useState([]);
  const [customersHasMore, setCustomersHasMore] = useState(false);
  const [warehouseSearchTerm, setWarehouseSearchTerm] = useState("");
  const [warehousePage, setWarehousePage] = useState(1);
  const [warehouseOptions, setWarehouseOptions] = useState([]);
  const [warehousesHasMore, setWarehousesHasMore] = useState(false);
  const [productSearchTerm, setProductSearchTerm] = useState("");
  const [productPage, setProductPage] = useState(1);
  const [productOptions, setProductOptions] = useState([]);
  const [productsHasMore, setProductsHasMore] = useState(false);
  const [taxSearchTerm, setTaxSearchTerm] = useState("");
  const [taxPage, setTaxPage] = useState(1);
  const [taxOptions, setTaxOptions] = useState([]);
  const [taxHasMore, setTaxHasMore] = useState(false);

  const customersQueryString = useMemo(() => {
    const params = new URLSearchParams();
    params.set("page", String(customerPage));
    if (customerSearchTerm.trim()) params.set("q", customerSearchTerm.trim());
    return params.toString();
  }, [customerPage, customerSearchTerm]);

  const productsQueryString = useMemo(() => {
    const params = new URLSearchParams();
    params.set("page", String(productPage));
    if (productSearchTerm.trim()) params.set("q", productSearchTerm.trim());
    return params.toString();
  }, [productPage, productSearchTerm]);

  const warehousesQueryString = useMemo(() => {
    const params = new URLSearchParams();
    params.set("page", String(warehousePage));
    if (warehouseSearchTerm.trim()) params.set("q", warehouseSearchTerm.trim());
    return params.toString();
  }, [warehousePage, warehouseSearchTerm]);

  const taxQueryString = useMemo(() => {
    const params = new URLSearchParams();
    params.set("page", String(taxPage));
    if (taxSearchTerm.trim()) params.set("q", taxSearchTerm.trim());
    return params.toString();
  }, [taxPage, taxSearchTerm]);

  const customersQuery = useCustomQuery(
    `/api/sales/customers/?${customersQueryString}`,
    ["sales-customers-invoice-options", customersQueryString],
  );
  const productsQuery = useCustomQuery(
    `/api/sales/catalog-items/?${productsQueryString}`,
    ["sales-catalog-items-invoice-options", productsQueryString],
  );
  const warehousesQuery = useCustomQuery(
    `/api/inventory/warehouses/?${warehousesQueryString}`,
    ["inventory-warehouses-invoice-options", warehousesQueryString],
  );
  const taxRulesQuery = useCustomQuery(
    `/api/sales/tax-rules/?${taxQueryString}`,
    ["sales-tax-rules-invoice-options", taxQueryString],
  );
  const invoiceDetailsQuery = useCustomQuery(
    `/api/sales/invoices/${invoiceId}/`,
    ["sales-invoice-edit", invoiceId],
    { enabled: isEditMode },
  );

  const createInvoiceMutation = useCustomPost("/api/sales/invoices/create/", [
    ["sales-invoices"],
  ]);
  const updateInvoiceMutation = useCustomPatch(
    (id) => `/api/sales/invoices/${id}/`,
    [
      ["sales-invoices"],
      ["sales-invoice-edit", invoiceId],
      ["sales-invoice-preview", invoiceId],
    ],
  );

  useEffect(() => {
    setCustomerPage(1);
  }, [customerSearchTerm]);
  useEffect(() => {
    setProductPage(1);
  }, [productSearchTerm]);
  useEffect(() => {
    setWarehousePage(1);
  }, [warehouseSearchTerm]);
  useEffect(() => {
    setTaxPage(1);
  }, [taxSearchTerm]);

  useEffect(() => {
    const normalized = normalizePagedResponse(customersQuery.data);
    setCustomersHasMore(normalized.hasMore);
    setCustomerOptions((prev) =>
      mergeUniqueById(
        prev,
        normalized.items
          .filter((c) => c?.is_active !== false)
          .map((c) => ({
            id: c.id,
            name: c.name || "Unnamed customer",
            contactPerson: c.contact_person || "",
            email: c.email || "",
            phone: c.phone || "",
            currencyCode: c.currency_code || "",
          })),
        customerPage,
      ),
    );
  }, [customersQuery.data, customerPage]);

  useEffect(() => {
    const normalized = normalizePagedResponse(productsQuery.data);
    setProductsHasMore(normalized.hasMore);
    setProductOptions((prev) =>
      mergeUniqueById(
        prev,
        normalizeCatalogItems(productsQuery.data),
        productPage,
      ),
    );
  }, [productsQuery.data, productPage]);

  useEffect(() => {
    const normalized = normalizePagedResponse(warehousesQuery.data);
    setWarehousesHasMore(normalized.hasMore);
    setWarehouseOptions((prev) =>
      mergeUniqueById(
        prev,
        normalizeWarehouses(warehousesQuery.data),
        warehousePage,
      ),
    );
  }, [warehousesQuery.data, warehousePage]);

  useEffect(() => {
    const normalized = normalizePagedResponse(taxRulesQuery.data, "tax_rules");
    setTaxHasMore(normalized.hasMore);
    setTaxOptions((prev) =>
      mergeUniqueById(
        prev,
        normalized.items.map((rule) => ({
          id: rule.id,
          name: rule.name || "Unnamed tax rule",
          rate: toNumber(rule.rate_percent ?? rule.rate),
        })),
        taxPage,
      ),
    );
  }, [taxRulesQuery.data, taxPage]);

  const allTaxOptions = useMemo(() => {
    const contextMapped = contextTaxRules.map((r) => ({
      id: r.id,
      name: r.name || "Unnamed tax rule",
      rate: toNumber(r.rate),
    }));
    const merged = [...contextMapped];
    const ids = new Set(merged.map((r) => r.id));
    taxOptions.forEach((r) => {
      if (!ids.has(r.id)) merged.push(r);
    });
    return merged;
  }, [contextTaxRules, taxOptions]);

  const isSubmitting =
    createInvoiceMutation.isPending || updateInvoiceMutation.isPending;

  const handleSubmit = async (payload) => {
    try {
      if (isEditMode) {
        await updateInvoiceMutation.mutateAsync({ id: invoiceId, ...payload });
      } else {
        await createInvoiceMutation.mutateAsync(payload);
      }
      toast.success(
        isEditMode
          ? "Invoice updated successfully."
          : "Invoice created successfully.",
      );
      navigate(
        isEditMode
          ? `${basePath}/accounting/invoices/${invoiceId}`
          : `${basePath}/accounting/invoices`,
      );
    } catch (error) {
      toast.error(
        getApiErrorMessage(
          error,
          isEditMode
            ? "Failed to update invoice."
            : "Failed to create invoice.",
        ),
      );
    }
  };

  if (isEditMode && invoiceDetailsQuery.isLoading) {
    return (
      <div
        style={{ minHeight: "320px", display: "grid", placeItems: "center" }}
      >
        <Spinner />
      </div>
    );
  }

  if (isEditMode && invoiceDetailsQuery.isError) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        <Button
          variant="ghost"
          icon={<ArrowLeft size={18} />}
          onClick={() => navigate(invoicesRoute)}
          className="cursor-pointer shrink-0"
          style={{ alignSelf: "flex-start" }}
        >
          Back to invoices
        </Button>
        <Card className="padding-lg">
          <div style={{ color: "var(--color-error)" }}>
            Failed to load invoice details.
          </div>
        </Card>
      </div>
    );
  }

  return (
    <InvoiceForm
      customerOptions={customerOptions}
      productOptions={productOptions}
      warehouseOptions={warehouseOptions}
      taxOptions={allTaxOptions}
      customerPagination={{
        searchTerm: customerSearchTerm,
        onSearchChange: setCustomerSearchTerm,
        hasMore: customersHasMore,
        onLoadMore: () => setCustomerPage((p) => p + 1),
        isLoading: customersQuery.isFetching && customerPage === 1,
        isLoadingMore: customersQuery.isFetching && customerPage > 1,
        error: customersQuery.isError ? "Failed to load customers." : "",
      }}
      productPagination={{
        searchTerm: productSearchTerm,
        onSearchChange: setProductSearchTerm,
        hasMore: productsHasMore,
        onLoadMore: () => setProductPage((p) => p + 1),
        isLoading: productsQuery.isFetching && productPage === 1,
        isLoadingMore: productsQuery.isFetching && productPage > 1,
        error: productsQuery.isError ? "Failed to load items." : "",
      }}
      warehousePagination={{
        searchTerm: warehouseSearchTerm,
        onSearchChange: setWarehouseSearchTerm,
        hasMore: warehousesHasMore,
        onLoadMore: () => setWarehousePage((p) => p + 1),
        isLoading: warehousesQuery.isFetching && warehousePage === 1,
        isLoadingMore: warehousesQuery.isFetching && warehousePage > 1,
        error: warehousesQuery.isError ? "Failed to load warehouses." : "",
      }}
      taxPagination={{
        searchTerm: taxSearchTerm,
        onSearchChange: setTaxSearchTerm,
        hasMore: taxHasMore,
        onLoadMore: () => setTaxPage((p) => p + 1),
        isLoading: taxRulesQuery.isFetching && taxPage === 1,
        isLoadingMore: taxRulesQuery.isFetching && taxPage > 1,
        error: taxRulesQuery.isError ? "Failed to load tax rules." : "",
      }}
      initialInvoice={isEditMode ? invoiceDetailsQuery.data : null}
      onSubmit={handleSubmit}
      onCancel={() => navigate(invoicesRoute)}
      isSubmitting={isSubmitting}
      showHeader
      headerTitle={isEditMode ? "Edit Invoice" : "Create Invoice"}
      headerSubtitle={
        isEditMode
          ? "Update sales invoice details."
          : "Issue a new sales invoice to a Customer."
      }
      showAddCustomerButton
      onAddCustomer={() => navigate(`${basePath}/accounting/customers/new`)}
    />
  );
};

export default CreateInvoice;
