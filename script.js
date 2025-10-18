function addGoogleCalendarEvent() {
    // Bereken de datum over 30 dagen
    const now = new Date();
    const startDate = new Date(now.getTime() + (30 * 24 * 60 * 60 * 1000));
    const endDate = new Date(startDate.getTime() + (60 * 60 * 1000)); // 1 uur later

    // Formatteer naar YYYYMMDDTHHMMSSZ voor Google Agenda
    const formatDate = (date) => {
        return date.toISOString().replace(/-|:|\.\d+/g, '');
    };

    const start = formatDate(startDate);
    const end = formatDate(endDate);

    const title = encodeURIComponent('Nieuwe subsidieaanvraag indienen');
    const details = encodeURIComponent('Vergeet niet opnieuw een subsidie aan te vragen voor jouw bedrijf in Pixel Roleplay!');
    const location = encodeURIComponent('Pixel Roleplay Stadskantoor');

    const url = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${start}/${end}&details=${details}&location=${location}&sf=true&output=xml`;

    window.open(url, '_blank');
}
