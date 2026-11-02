// Utility to generate WhatsApp one-tap share message and link for blood requests (SCRUM-32).
const WA_BASE_URL = 'https://api.whatsapp.com/send?text=';

function formatWhatsAppMessage(request, options = {}) {
    if (!request) return '';
    const bloodGroup = request.blood_group || 'Unknown';
    const component = request.component || 'Whole Blood';
    const units = request.units_required || 1;
    const urgency = request.urgency || 'Urgent';
    const hospitalName = request.hospital_name || 'Hospital';
    const city = request.city || '';
    const hospitalAddress = request.hospital_address ? ` (${request.hospital_address})` : '';
    const appBaseUrl = options.baseUrl || process.env.APP_URL || 'http://localhost:5000';
    const requestLink = options.requestLink || `${appBaseUrl}/api/requests/${request.request_id}`;

    return [
        '🚨 *URGENT BLOOD REQUEST - BLOODBOUND* 🚨',
        '',
        `• *Blood Group:* ${bloodGroup}`,
        `• *Component:* ${component}`,
        `• *Units Required:* ${units}`,
        `• *Urgency:* ${urgency}`,
        `• *Hospital:* ${hospitalName}, ${city}${hospitalAddress}`,
        '',
        'If you are eligible or know someone who can donate, please respond:',
        requestLink,
        '',
        '_Every donation saves a life. Please share with your contacts and groups._'
    ].join('\n');
}

function generateWhatsAppUrl(request, options = {}) {
    const text = formatWhatsAppMessage(request, options);
    return `${WA_BASE_URL}${encodeURIComponent(text)}`;
}

module.exports = {
    WA_BASE_URL,
    formatWhatsAppMessage,
    generateWhatsAppUrl
};
