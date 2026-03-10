export const formatDate = (dateString: string) => {
  if (!dateString) return '—';
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch (e) {
    return dateString;
  }
};

export const formatTime = (timeString: string) => {
  if (!timeString) return '—';
  try {
    // Handle Postgres time format like "14:00:00.000000" or "14:00:00"
    const parts = timeString.split(':');
    if (parts.length < 2) return timeString;
    
    let hours = parseInt(parts[0]);
    const minutes = parts[1];
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12; // the hour '0' should be '12'
    
    return `${hours}:${minutes} ${ampm}`;
  } catch (e) {
    return timeString;
  }
};
