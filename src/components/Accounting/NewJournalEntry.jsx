import React, { useEffect, useMemo, useState } from 'react';
import { Controller, useFieldArray, useForm, useWatch } from 'react-hook-form';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { useAccounting } from '@/context/AccountingContext';
import useCustomQuery from '@/hooks/useQuery';
import { useCustomPost, useCustomPut } from '@/hooks/useMutation';
import Card from '@/components/Shared/Card';
import Button from '@/components/Shared/Button';
import Input from '@/components/Shared/Input';
import { Save, Plus, Trash2, ArrowLeft, Upload, FileText, CheckCircle, AlertTriangle, XCircle, Monitor, Lock } from 'lucide-react';
import ConfirmationModal from '@/components/Shared/ConfirmationModal';

const defaultLine = { account: '', accountLabel: '', description: '', debit: 0, credit: 0, costCenter: '' };

const defaultValues = {
  date: new Date().toISOString().split('T')[0],
  reference: '',
  description: '',
  currency: 'JOD',
  exchangeRate: 1,
  attachedFile: null,
  createdBy: 'Admin User',
  status: 'Draft',
  sourceType: 'Manual',
  isAutomatic: false,
  lines: [{ ...defaultLine }, { ...defaultLine }],
};

const normalizeEntryResponse = (response) => {
  if (Array.isArray(response)) return response[0] || null;
  return response || null;
};

const normalizeAccountsResponse = (response) => {
  const source = Array.isArray(response)
    ? response
    : Array.isArray(response?.data)
      ? response.data
      : Array.isArray(response?.results)
        ? response.results
        : [];
  return source
    .map((account) => ({
      id: account?.id || account?.uuid || '',
      code: String(account?.code || ''),
      name: account?.name || '',
      parentCode: account?.parent_code || account?.parentCode || '',
      type: account?.account_type_name || account?.account_type || account?.type || '',
      isGroup: Boolean(account?.is_group ?? account?.isGroup),
    }))
    .filter((account) => account.id && account.code);
};

const normalizeCurrenciesResponse = (response) => {
  const source = Array.isArray(response)
    ? response
    : Array.isArray(response?.data)
      ? response.data
      : Array.isArray(response?.results)
        ? response.results
        : [];

  return source
    .map((currency) => ({
      id: currency?.id || '',
      code: String(currency?.code || '').toUpperCase(),
      name: currency?.name || '',
    }))
    .filter((currency) => currency.code);
};

const NewJournalEntry = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { costCenters, budgetUsage, getAccountBalance, getPeriodStatus } = useAccounting();
  const [warningModal, setWarningModal] = useState({ isOpen: false, messages: [] });
  const [blockingErrors, setBlockingErrors] = useState([]);
  const [pendingStatus, setPendingStatus] = useState(null);

  const { control, handleSubmit, reset, setValue, getValues } = useForm({ defaultValues });
  const { fields, append, remove } = useFieldArray({ control, name: 'lines' });
  const entryDetailQuery = useCustomQuery(`/accounting/journal-entries/${id}/`, ['journal-entry', id], {
    enabled: Boolean(id),
    select: normalizeEntryResponse,
  });
  const accountsQuery = useCustomQuery('/accounting/accounts/', ['accounting-accounts'], {
    select: normalizeAccountsResponse,
  });
  const currenciesQuery = useCustomQuery('/api/shared/currencies/', ['shared-currencies'], {
    select: normalizeCurrenciesResponse,
  });

  const createMutation = useCustomPost('/accounting/journal-entries/create/', ['journal-entries']);
  const updateMutation = useCustomPut(`/accounting/journal-entries/${id || 'new'}/`, ['journal-entries', ['journal-entry', id]]);

  const allAccounts = useMemo(() => accountsQuery.data ?? [], [accountsQuery.data]);
  const currencies = useMemo(
    () => (currenciesQuery.data ?? []).sort((a, b) => a.code.localeCompare(b.code)),
    [currenciesQuery.data]
  );
  const sortedAccounts = useMemo(
    () => allAccounts.filter((account) => !account.isGroup).sort((a, b) => a.code.localeCompare(b.code)),
    [allAccounts]
  );
  const accountById = useMemo(() => new Map(allAccounts.map((account) => [account.id, account])), [allAccounts]);

  const formDate = useWatch({ control, name: 'date' });
  const currency = useWatch({ control, name: 'currency' });
  const exchangeRate = Number(useWatch({ control, name: 'exchangeRate' })) || 1;
  const isAutomatic = Boolean(useWatch({ control, name: 'isAutomatic' }));
  const sourceType = useWatch({ control, name: 'sourceType' });
  const lines = useWatch({ control, name: 'lines' }) || [];
  const attachedFile = useWatch({ control, name: 'attachedFile' });

  const totalDebit = lines.reduce((sum, line) => sum + Number(line?.debit || 0), 0);
  const totalCredit = lines.reduce((sum, line) => sum + Number(line?.credit || 0), 0);
  const isBalanced = Math.abs(totalDebit - totalCredit) < 0.01 && totalDebit > 0;

  const periodStatus = getPeriodStatus(formDate);
  const isPeriodLocked = periodStatus === 'Hard Lock';
  const isReadOnly = isAutomatic || isPeriodLocked;

  useEffect(() => {
    if (accountsQuery.error) {
      toast.error('Failed to load accounts list.');
    }
  }, [accountsQuery.error]);

  useEffect(() => {
    if (entryDetailQuery.error) {
      toast.error('Failed to load journal entry details.');
    }
  }, [entryDetailQuery.error]);

  useEffect(() => {
    if (currenciesQuery.error) {
      toast.error('Failed to load currencies list.');
    }
  }, [currenciesQuery.error]);

  useEffect(() => {
    if (!id || !entryDetailQuery.data) return;
    const detail = entryDetailQuery.data;
    reset({
      date: detail.date || defaultValues.date,
      reference: detail.reference || '',
      description: detail.description || '',
      currency: detail.currency || 'JOD',
      exchangeRate: Number(detail.exchange_rate || detail.exchangeRate || 1),
      attachedFile: detail.attached_file || detail.attachedFile || null,
      createdBy: detail.created_by || detail.createdBy || 'Admin User',
      status: detail.status || 'Draft',
      sourceType: detail.source_type || detail.sourceType || 'Manual',
      isAutomatic: Boolean(detail.is_automatic ?? detail.isAutomatic),
      lines: (detail.lines || [])
        .slice()
        .sort((a, b) => Number(a?.order ?? 0) - Number(b?.order ?? 0))
        .map((line) => {
        const rawAccount = line.account_uuid || line.account_id || line.account || line.account_code || '';
        const matchedAccount = allAccounts.find((account) => account.id === rawAccount || account.code === rawAccount);
        return {
        id: line.id,
        account: matchedAccount?.id || rawAccount,
        accountLabel: line.account_name || line.accountName || matchedAccount?.name || '',
        description: line.description || '',
        debit: Number(line.debit || 0),
        credit: Number(line.credit || 0),
        costCenter: line.cost_center || line.costCenter || '',
        };
      }),
    });
  }, [allAccounts, entryDetailQuery.data, id, reset]);

  useEffect(() => {
    if (id) return;
    if (currency === 'JOD') setValue('exchangeRate', 1);
    if (currency === 'USD') setValue('exchangeRate', 0.71);
    if (currency === 'EUR') setValue('exchangeRate', 0.78);
    if (currency === 'SAR') setValue('exchangeRate', 0.19);
  }, [currency, id, setValue]);

  const getDepth = (account) => {
    if (!account.parentCode) return 0;
    const parent = allAccounts.find((item) => item.code === account.parentCode);
    return parent ? 1 + getDepth(parent) : 1;
  };

  const handleFileChange = (event) => {
    const file = event.target.files?.[0];
    setValue('attachedFile', file || null);
  };

  const executeSave = async (finalStatus) => {
    const values = getValues();
    const payload = new FormData();
    payload.append('date', values.date || '');
    payload.append('reference', values.reference || '');
    payload.append('description', values.description || '');
    payload.append('currency', values.currency || '');
    payload.append(
      'lines',
      JSON.stringify((values.lines || []).map((line, index) => ({
        ...(line.id ? { id: line.id } : {}),
        account: line.account,
        description: line.description || '',
        cost_center: line.costCenter || null,
        debit: Number(line.debit || 0).toFixed(2),
        credit: Number(line.credit || 0).toFixed(2),
        order: index,
      })))
    );
    if (values.attachedFile instanceof File) {
      payload.append('attached_file', values.attachedFile);
    }

    try {
      if (id) {
        await updateMutation.mutateAsync(payload);
        toast.success('Journal entry updated successfully.');
      } else {
        await createMutation.mutateAsync(payload);
        toast.success('Journal entry created successfully.');
      }
      navigate('/admin/accounting/journal');
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Failed to save journal entry.');
    }
  };

  const validateAndSave = (values, finalStatus) => {
    setBlockingErrors([]);
    const validationErrors = [];

    values.lines.forEach((line, index) => {
      if (!line.account) validationErrors.push(`Line ${index + 1}: Missing Account selection.`);
      if (Number(line.debit || 0) === 0 && Number(line.credit || 0) === 0) {
        validationErrors.push(`Line ${index + 1}: Amount must be positive and non-zero.`);
      }
      if (Number(line.debit || 0) < 0 || Number(line.credit || 0) < 0) {
        validationErrors.push(`Line ${index + 1}: Amounts cannot be negative.`);
      }
      if (Number(line.debit || 0) > 0 && Number(line.credit || 0) > 0) {
        validationErrors.push(`Line ${index + 1}: Cannot have both Debit and Credit. Use separate lines.`);
      }
    });

    if (finalStatus !== 'Draft' && !isBalanced) {
      validationErrors.push('Journal Entry is not balanced (Total Debit != Total Credit).');
    }

    if (validationErrors.length > 0) {
      setBlockingErrors(validationErrors);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    const warnings = [];
    if (finalStatus !== 'Draft') {
      values.lines.forEach((line) => {
        const creditAmount = Number(line.credit || 0);
        if (creditAmount <= 0) return;
        const account = accountById.get(line.account);
        const isCashOrBank = account && (account.parentCode === '1110' || account.parentCode === '1130');
        if (!isCashOrBank) return;

        const currentBalance = account?.id ? getAccountBalance(account.id) : 0;
        const projectedBalance = currentBalance - (creditAmount * exchangeRate);
        if (projectedBalance < 0) {
          warnings.push(`CASH WARNING: Credit to [${account.name}] will result in negative balance (${projectedBalance.toFixed(2)} JOD).`);
        }
      });

      const spendingByCC = {};
      values.lines.forEach((line) => {
        const debitAmount = Number(line.debit || 0);
        if (debitAmount <= 0 || !line.costCenter) return;
        const account = accountById.get(line.account);
        if (!account || account.type !== 'Expense') return;
        spendingByCC[line.costCenter] = (spendingByCC[line.costCenter] || 0) + (debitAmount * exchangeRate);
      });

      Object.entries(spendingByCC).forEach(([ccId, amount]) => {
        const costCenter = costCenters.find((item) => item.id === ccId);
        if (!costCenter) return;
        const currentSpent = budgetUsage[ccId] || 0;
        const maxBudget = costCenter.budget || 0;
        if (currentSpent + amount > maxBudget) {
          const excess = (currentSpent + amount) - maxBudget;
          warnings.push(`BUDGET WARNING: [${costCenter.name}] exceeds budget by ${excess.toFixed(2)} JOD.`);
        }
      });
    }

    if (warnings.length > 0) {
      setPendingStatus(finalStatus);
      setWarningModal({ isOpen: true, messages: warnings });
      return;
    }

    executeSave(finalStatus);
  };

  const onSaveDraft = handleSubmit((values) => validateAndSave(values, 'Draft'));
  const onPostEntry = handleSubmit((values) => validateAndSave(values, 'Posted'));

  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  return (
    <div>
      <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <Button variant="ghost" onClick={() => navigate('/admin/accounting/journal')}><ArrowLeft size={18} /> Back</Button>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700 }}>{id ? 'Edit Journal Entry' : 'New Journal Entry'}</h1>
        </div>
      </div>

      {isReadOnly && (
        <div
          style={{
            background: 'var(--color-warning-50)',
            border: '1px solid var(--color-warning-200)',
            borderRadius: 'var(--radius-md)',
            padding: '1rem',
            marginBottom: '1.5rem',
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
            color: 'var(--color-warning-800)',
          }}
        >
          {isAutomatic ? <Monitor size={24} /> : <Lock size={24} />}
          <div>
            <h4 style={{ fontWeight: 600, fontSize: '0.95rem' }}>
              {isAutomatic ? `Auto-Generated Entry (${sourceType || 'System'})` : 'Period Locked'}
            </h4>
            <p style={{ fontSize: '0.85rem' }}>
              {isAutomatic
                ? 'This entry was automatically generated. Please edit the original source transaction to make changes.'
                : 'The accounting period for this date is closed. Entries cannot be modified.'}
            </p>
          </div>
        </div>
      )}

      {blockingErrors.length > 0 && (
        <div style={{ background: '#fee2e2', color: '#991b1b', padding: '1rem', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem', border: '1px solid #fecaca' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', fontWeight: 600 }}>
            <XCircle size={18} /> Please fix the following errors:
          </div>
          <ul style={{ listStyle: 'disc', paddingLeft: '1.5rem', fontSize: '0.9rem' }}>
            {blockingErrors.map((err, index) => <li key={index}>{err}</li>)}
          </ul>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 350px', gap: '1.5rem', alignItems: 'start' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <Card style={{ padding: '1.5rem' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <FileText size={18} /> General Information
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
              <Controller
                name="date"
                control={control}
                render={({ field }) => <Input label="Date" type="date" value={field.value} onChange={field.onChange} disabled={isReadOnly} />}
              />
              <Controller
                name="reference"
                control={control}
                render={({ field }) => <Input label="Reference" placeholder="e.g. INV-2026-001" value={field.value} onChange={field.onChange} disabled={isReadOnly} />}
              />
              <div style={{ gridColumn: '1 / -1' }}>
                <Controller
                  name="description"
                  control={control}
                  render={({ field }) => <Input label="Description" placeholder="Description of the transaction..." value={field.value} onChange={field.onChange} disabled={isReadOnly} />}
                />
              </div>
            </div>
          </Card>

          <Card style={{ padding: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 600 }}>Journal Lines</h3>
              <div style={{ display: 'flex', gap: '1rem', fontSize: '0.9rem' }}>
                <span style={{ color: 'var(--color-text-secondary)' }}>Total Debit: <strong>{totalDebit.toFixed(2)}</strong></span>
                <span style={{ color: 'var(--color-text-secondary)' }}>Total Credit: <strong>{totalCredit.toFixed(2)}</strong></span>
                <span style={{ color: isBalanced ? 'var(--color-success-600)' : 'var(--color-danger-600)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                  {isBalanced ? <CheckCircle size={14} /> : <AlertTriangle size={14} />}
                  {isBalanced ? 'Balanced' : 'Unbalanced'}
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 2fr 1fr 1fr 1fr 40px', gap: '0.75rem', padding: '0.5rem', background: 'var(--color-bg-secondary)', borderRadius: 'var(--radius-sm)', fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-text-secondary)' }}>
                <div>Account</div><div>Line Description</div><div>Cost Center</div><div style={{ textAlign: 'right' }}>Debit</div><div style={{ textAlign: 'right' }}>Credit</div><div></div>
              </div>

              {fields.map((field, index) => (
                <div key={field.id} style={{ display: 'grid', gridTemplateColumns: '2fr 2fr 1fr 1fr 1fr 40px', gap: '0.75rem', alignItems: 'start' }}>
                  <Controller
                    name={`lines.${index}.account`}
                    control={control}
                    render={({ field: lineField }) => (
                      <select
                        value={lineField.value}
                        onChange={lineField.onChange}
                        disabled={isReadOnly || accountsQuery.isLoading}
                        style={{ width: '100%', padding: '0.5rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)', fontSize: '0.9rem', height: '38px' }}
                      >
                        <option value="">{accountsQuery.isLoading ? 'Loading accounts...' : 'Select Account'}</option>
                        {lineField.value && !sortedAccounts.some((account) => account.id === lineField.value) && (
                          <option value={lineField.value}>
                            {lines[index]?.accountLabel
                              ? `${lines[index].accountLabel} (${lineField.value})`
                              : `Existing Account (${lineField.value})`}
                          </option>
                        )}
                        {sortedAccounts.map((account) => (
                          <option key={account.id} value={account.id}>
                            {'\u00A0'.repeat(getDepth(account) * 3)} {account.code} - {account.name}
                          </option>
                        ))}
                      </select>
                    )}
                  />
                  <Controller
                    name={`lines.${index}.description`}
                    control={control}
                    render={({ field: lineField }) => (
                      <input
                        type="text"
                        placeholder="Description"
                        value={lineField.value || ''}
                        onChange={lineField.onChange}
                        disabled={isReadOnly}
                        style={{ width: '100%', padding: '0.5rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)', fontSize: '0.9rem' }}
                      />
                    )}
                  />
                  <Controller
                    name={`lines.${index}.costCenter`}
                    control={control}
                    render={({ field: lineField }) => (
                      <select
                        value={lineField.value || ''}
                        onChange={lineField.onChange}
                        disabled={isReadOnly}
                        style={{ width: '100%', padding: '0.5rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)', fontSize: '0.9rem', height: '38px' }}
                      >
                        <option value="">None</option>
                        {costCenters.map((cc) => <option key={cc.id} value={cc.id}>{cc.name} ({cc.code})</option>)}
                      </select>
                    )}
                  />
                  <Controller
                    name={`lines.${index}.debit`}
                    control={control}
                    render={({ field: lineField }) => (
                      <input
                        type="number"
                        placeholder="0.00"
                        value={lineField.value}
                        onChange={lineField.onChange}
                        disabled={isReadOnly}
                        style={{ width: '100%', padding: '0.5rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)', fontSize: '0.9rem', textAlign: 'right' }}
                      />
                    )}
                  />
                  <Controller
                    name={`lines.${index}.credit`}
                    control={control}
                    render={({ field: lineField }) => (
                      <input
                        type="number"
                        placeholder="0.00"
                        value={lineField.value}
                        onChange={lineField.onChange}
                        disabled={isReadOnly}
                        style={{ width: '100%', padding: '0.5rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)', fontSize: '0.9rem', textAlign: 'right' }}
                      />
                    )}
                  />

                  <button
                    onClick={() => {
                      if (fields.length > 2 && !isReadOnly) remove(index);
                    }}
                    style={{ background: 'none', border: 'none', color: isReadOnly ? 'var(--color-text-muted)' : 'var(--color-danger-500)', cursor: isReadOnly ? 'not-allowed' : 'pointer', padding: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    disabled={isReadOnly}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}

              {!isReadOnly && (
                <button
                  onClick={() => append({ ...defaultLine })}
                  style={{ background: 'none', border: '1px dashed var(--color-border)', borderRadius: 'var(--radius-sm)', padding: '0.75rem', color: 'var(--color-primary-600)', fontSize: '0.9rem', fontWeight: 500, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginTop: '0.5rem' }}
                >
                  <Plus size={16} /> Add Line
                </button>
              )}
            </div>
          </Card>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <Card style={{ padding: '1.5rem' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem' }}>Entry Settings</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <Controller
                name="currency"
                control={control}
                render={({ field }) => (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <label style={{ fontSize: '0.875rem', fontWeight: 500 }}>Currency</label>
                    <select
                      value={field.value}
                      onChange={field.onChange}
                      disabled={isReadOnly || currenciesQuery.isLoading}
                      style={{ width: '100%', padding: '0.5rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)', fontSize: '0.9rem' }}
                    >
                      <option value="">
                        {currenciesQuery.isLoading ? 'Loading currencies...' : 'Select currency'}
                      </option>
                      {currency && !currencies.some((item) => item.code === currency) && (
                        <option value={currency}>{currency}</option>
                      )}
                      {currencies.map((item) => (
                        <option key={item.id || item.code} value={item.code}>
                          {item.code} - {item.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              />

              {currency !== 'JOD' && (
                <Controller
                  name="exchangeRate"
                  control={control}
                  render={({ field }) => (
                    <Input label="Exchange Rate" type="number" step="0.01" value={String(field.value)} onChange={field.onChange} disabled={isReadOnly} />
                  )}
                />
              )}

              <Controller
                name="createdBy"
                control={control}
                render={({ field }) => <Input label="Created By" value={field.value || 'Admin User'} disabled />}
              />

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <label style={{ fontSize: '0.875rem', fontWeight: 500 }}>Attachment</label>
                <div style={{ border: '1px dashed var(--color-border)', borderRadius: 'var(--radius-sm)', padding: '1rem', textAlign: 'center', cursor: isReadOnly ? 'not-allowed' : 'pointer', background: 'var(--color-bg-secondary)' }}>
                  <input type="file" id="file" hidden onChange={handleFileChange} disabled={isReadOnly} />
                  <label htmlFor="file" style={{ cursor: isReadOnly ? 'not-allowed' : 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', color: 'var(--color-text-secondary)' }}>
                    <Upload size={20} />
                    <span style={{ fontSize: '0.85rem' }}>{attachedFile?.name || attachedFile || 'Upload Document'}</span>
                  </label>
                </div>
              </div>
            </div>
          </Card>

          <Card style={{ padding: '1.5rem' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {!isReadOnly && (
                <>
                  <Button fullWidth onClick={onPostEntry} icon={<CheckCircle size={18} />} disabled={isSubmitting}>
                    {isSubmitting ? 'Saving...' : 'Post Entry'}
                  </Button>
                  <Button fullWidth variant="outline" onClick={onSaveDraft} icon={<Save size={18} />} disabled={isSubmitting}>
                    {isSubmitting ? 'Saving...' : 'Save as Draft'}
                  </Button>
                </>
              )}
              {isReadOnly && (
                <div style={{ padding: '1rem', textAlign: 'center', color: 'var(--color-text-muted)', fontSize: '0.9rem', fontStyle: 'italic' }}>
                  Viewing Mode Only
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>

      <ConfirmationModal
        isOpen={warningModal.isOpen}
        onCancel={() => setWarningModal({ isOpen: false, messages: [] })}
        onConfirm={() => {
          setWarningModal({ isOpen: false, messages: [] });
          if (pendingStatus) executeSave(pendingStatus);
        }}
        title="Validation Warnings"
        message={<ul style={{ listStyle: 'disc', paddingLeft: '1.5rem' }}>{warningModal.messages.map((msg, index) => <li key={index}>{msg}</li>)}</ul>}
        confirmText="Proceed Anyway"
        type="warning"
      />
    </div>
  );
};

export default NewJournalEntry;
