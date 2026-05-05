import React, { useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import Modal from '@/components/Shared/Modal';
import Button from '@/components/Shared/Button';
import useCustomQuery from '@/hooks/useQuery';

const normalizeEntry = (response) => {
  if (Array.isArray(response)) return response[0] || null;
  return response || null;
};

const JournalEntryDetailModal = ({ isOpen, entryId, onClose }) => {
  const navigate = useNavigate();
  const detailUrl = entryId ? `/accounting/journal-entries/${entryId}/` : '';

  const detailQuery = useCustomQuery(detailUrl, ['journal-entry', entryId], {
    enabled: isOpen && Boolean(entryId),
    select: normalizeEntry,
  });

  const entry = detailQuery.data;
  const lines = useMemo(() => entry?.lines ?? [], [entry?.lines]);

  const handleEdit = () => {
    if (!entryId) return;
    onClose();
    navigate(`/admin/accounting/journal/${entryId}`);
  };

  useEffect(() => {
    if (detailQuery.error) {
      toast.error('Failed to load journal entry details.');
    }
  }, [detailQuery.error]);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Journal Entry Details" size="lg">
      {detailQuery.isLoading && <p style={{ color: 'var(--color-text-secondary)' }}>Loading details...</p>}

      {!detailQuery.isLoading && !entry && (
        <p style={{ color: 'var(--color-text-secondary)' }}>Entry details are not available.</p>
      )}

      {!detailQuery.isLoading && entry && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
              gap: '1rem',
              background: 'var(--color-bg-secondary)',
              borderRadius: 'var(--radius-md)',
              padding: '1rem',
              border: '1px solid var(--color-border)',
            }}
          >
            <div><strong>Date:</strong> {entry.date || '-'}</div>
            <div><strong>Reference:</strong> {entry.reference || '-'}</div>
            <div><strong>Currency:</strong> {entry.currency || 'JOD'}</div>
            <div><strong>Status:</strong> {entry.status || '-'}</div>
            <div style={{ gridColumn: '1 / -1' }}><strong>Description:</strong> {entry.description || '-'}</div>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
              <thead>
                <tr style={{ background: 'var(--color-bg-table-header)', borderBottom: '1px solid var(--color-border)' }}>
                  <th style={{ padding: '0.75rem', textAlign: 'left' }}>Account</th>
                  <th style={{ padding: '0.75rem', textAlign: 'left' }}>Description</th>
                  <th style={{ padding: '0.75rem', textAlign: 'right' }}>Debit</th>
                  <th style={{ padding: '0.75rem', textAlign: 'right' }}>Credit</th>
                </tr>
              </thead>
              <tbody>
                {lines.map((line, index) => (
                  <tr key={line.id || index} style={{ borderBottom: '1px solid var(--color-border)' }}>
                    <td style={{ padding: '0.75rem' }}>{line.account_name || line.accountName || line.account || '-'}</td>
                    <td style={{ padding: '0.75rem' }}>{line.description || '-'}</td>
                    <td style={{ padding: '0.75rem', textAlign: 'right' }}>{line.debit || '0.00'}</td>
                    <td style={{ padding: '0.75rem', textAlign: 'right' }}>{line.credit || '0.00'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
            <Button variant="outline" onClick={onClose}>Close</Button>
            <Button onClick={handleEdit}>Edit Entry</Button>
          </div>
        </div>
      )}
    </Modal>
  );
};

export default JournalEntryDetailModal;
