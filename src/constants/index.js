// DO NOT RENAME PROPERTIES! USED TO GENERATED "status" IN RESPONSE BY PROPERTY NAME.
export const delegateRequestStatuses = {
  new: 0, // the delegated transaction request was just requested and is not confirmed yet
  confirmed: 1, // the transaction is confirmed and is ready to be published (picked up by worker shortly)
  mining: 2, // the transaction is in mining state
  mined: 3, // when the transaction is mined both successfully or with an error (but mined!)
  failed: 4 // any failed attempts to publish or republish a transaction, including transaction drop, etc
};