import prisma from '../config/prisma.js'

export async function issueCertificate(req, res) {
  try {
    const { studentId, subjectId, title } = req.body
    const certificate = await prisma.certificate.create({
      data: { studentId, subjectId, title: title || 'Certificate of Excellence', issuedBy: req.user.id },
    })
    res.status(201).json({ success: true, data: certificate })
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to issue certificate' })
  }
}

export async function getStudentCertificates(req, res) {
  try {
    const { studentId } = req.params
    const certs = await prisma.certificate.findMany({
      where: { studentId },
      include: {
        subject: { select: { name: true } },
        issuer: { select: { name: true } },
      },
      orderBy: { issuedAt: 'desc' },
    })
    res.json({ success: true, data: certs })
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch certificates' })
  }
}
