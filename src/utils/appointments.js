export function clientFromAppointment(appointment, date) {
  return {
    name: appointment?.clientName || '',
    age: '',
    sex: 'M',
    email: appointment?.email || '',
    trainer: appointment?.trainerName || '',
    date: date || '',
    notes: '',
    ghlContactId: appointment?.contactId || '',
    appointmentId: appointment?.eventId || '',
  }
}
