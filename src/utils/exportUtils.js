/**
 * Exports data to a CSV file and triggers a download.
 * @param {Array} data - Array of objects to export
 * @param {string} filename - The name of the file (without extension)
 */
export const exportToCSV = (data, filename = 'export') => {
    if (!data || !data.length) {
        console.warn('No data to export');
        return;
    }

    // Extract headers from the first object
    const headers = Object.keys(data[0]);

    // Create CSV rows
    const csvRows = [];

    // Add header row
    csvRows.push(headers.join(','));

    // Add data rows
    for (const row of data) {
        const values = headers.map(header => {
            const val = row[header];
            // Handle null/undefined
            if (val === null || val === undefined) return '';
            // Handle objects/arrays (convert to string)
            const escaped = ('' + val).replace(/"/g, '""');
            // Wrap in quotes if it contains a comma or newline
            return escaped.includes(',') || escaped.includes('\n') ? `"${escaped}"` : escaped;
        });
        csvRows.push(values.join(','));
    }

    // Create Blob and trigger download
    const csvContent = csvRows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};
