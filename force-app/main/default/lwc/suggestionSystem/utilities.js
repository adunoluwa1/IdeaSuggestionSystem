export function formatDateTime(dateTimeStr) {
    const date = new Date(dateTimeStr);
    const options = {
        year: 'numeric', month: '2-digit', day: '2-digit',
        hour: '2-digit', minute: '2-digit',
        hour12: true
    };
    return date.toLocaleDateString('en-US', options).replace(',', '');
}