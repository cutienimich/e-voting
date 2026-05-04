// prisma/schema.prisma — ADD these fields to your existing Student model
// (Don't replace your whole schema, just add the missing fields)

// ─── Add to your Student model ────────────────────────────
// 
// model Student {
//   id            String   @id @default(cuid())
//   studentId     String   @unique
//   name          String
//   password      String
//
//   // ← ADD THESE:
//   email         String?  @unique   // for Gmail OTP reset
//   phone         String?  @unique   // for SMS OTP reset
//   faceEnrolled  Boolean  @default(false)
//   faceId        String?            // AWS Rekognition FaceId
//
//   // ... rest of your existing fields ...
// }

// After editing schema.prisma, run:
//   npx prisma migrate dev --name add_email_phone_face
// or (if you're still in dev and ok with reset):
//   npx prisma db push
