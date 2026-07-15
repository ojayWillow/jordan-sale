// ============================================================================
// Bank-transfer payment details for reservations.
//
// When your IBAN is ready:
//   1. Fill in iban / recipient (bank + note are optional).
//   2. Set enabled: true.
//   3. Commit + push.
//
// Until enabled is true, no payment info is shown to buyers — the rest of the
// site (chat, reservations) keeps working normally.
//
// These details are shown ONLY inside a buyer's own private reservation chat
// (never publicly on the catalog), together with a short reference code so you
// can match the incoming transfer to the reservation.
// ============================================================================
window.PAY = {
  enabled: false,
  iban: "",            // e.g. "LV00 HABA 0000 0000 0000 0"
  recipient: "",       // name the buyer will see as the transfer recipient
  bank: "",            // optional, e.g. "Swedbank" / "Revolut"
  note: ""             // optional extra line, e.g. "Pārskaitījumu apstrādājam 1 d. laikā"
};
