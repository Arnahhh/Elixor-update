const express = require("express");
const prisma = require("../prismaClient");
const { requireAuth, requireRole } = require("../middleware/auth");

const router = express.Router();

const VALID_STATUSES = new Set(["CONFIRMED", "COMPLETED", "CANCELLED"]);

router.post("/", requireAuth, requireRole("PATIENT"), async (req, res) => {
  try {
    const { doctorId, appointmentDate } = req.body;

    if (!doctorId || !appointmentDate) {
      return res.status(400).json({ error: "doctorId and appointmentDate are required" });
    }

    const parsedDoctorId = parseInt(doctorId, 10);
    if (isNaN(parsedDoctorId)) {
      return res.status(400).json({ error: "doctorId must be an integer" });
    }

    const parsedDate = new Date(appointmentDate);
    if (isNaN(parsedDate.getTime())) {
      return res.status(400).json({ error: "Invalid appointmentDate format" });
    }

    if (parsedDate <= new Date()) {
      return res.status(400).json({
        error: "Appointment date and time must be in the future.",
      });
    }

    const doctor = await prisma.user.findUnique({
      where: { id: parsedDoctorId },
    });

    if (!doctor || doctor.role !== "DOCTOR") {
      return res.status(404).json({ error: "Doctor not found" });
    }

    const appointment = await prisma.appointment.create({
      data: {
        patientId: req.user.id,
        doctorId: parsedDoctorId,
        appointmentDate: parsedDate,
        status: "PENDING",
      },
      include: {
        patient: {
          select: { id: true, name: true, email: true },
        },
        doctor: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    return res.status(201).json(appointment);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Failed to create appointment" });
  }
});

router.get("/", requireAuth, async (req, res) => {
  try {
    const where =
      req.user.role === "DOCTOR"
        ? { doctorId: req.user.id }
        : { patientId: req.user.id };

    const appointments = await prisma.appointment.findMany({
      where,
      include: {
        patient: {
          select: { id: true, name: true, email: true },
        },
        doctor: {
          select: { id: true, name: true, email: true },
        },
      },
      orderBy: {
        appointmentDate: "asc",
      },
    });

    return res.json(appointments);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Failed to fetch appointments" });
  }
});

router.patch("/:id/status", requireAuth, requireRole("DOCTOR"), async (req, res) => {
  try {
    const appointmentId = parseInt(req.params.id, 10);
    if (isNaN(appointmentId)) {
      return res.status(400).json({ error: "Invalid appointment ID" });
    }

    const { status } = req.body;
    if (!status || !VALID_STATUSES.has(status)) {
      return res.status(400).json({
        error: "status must be one of CONFIRMED, COMPLETED, CANCELLED",
      });
    }

    const appointment = await prisma.appointment.findFirst({
      where: {
        id: appointmentId,
        doctorId: req.user.id,
      },
    });

    if (!appointment) {
      return res.status(404).json({ error: "Appointment not found" });
    }

    const updatedAppointment = await prisma.appointment.update({
      where: { id: appointmentId },
      data: { status },
      include: {
        patient: {
          select: { id: true, name: true, email: true },
        },
        doctor: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    return res.json(updatedAppointment);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Failed to update appointment status" });
  }
});

module.exports = router;
