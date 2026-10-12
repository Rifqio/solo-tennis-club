// Direct uploads (hosted demo only). POST /api/admin/uploads or /api/customer/uploads with { purpose } answers with a
// ticket: either the browser puts the file into Blob under `key` with `token` and then sends { key } instead of the
// file, or `direct` is false and the file goes in the request body as usual.
export type UploadPurpose = 'photo' | 'coach' | 'proof'

export type UploadTicketResponse =
  | { direct: false }
  | { direct: true; key: string; token: string; access: 'private' }
