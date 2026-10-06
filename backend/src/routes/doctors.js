const express = require("express");
const prisma = require("../prismaClient");
const { requireAuth, requireRole } = require("../middleware/auth");

const router = express.Router();

function parseTime(val) {
  if (val instanceof Date) return val;
  if (typeof val === "string") {
    const date = new Date(val);
    if (!isNaN(date.getTime())) {
      return date;
    }
    const timeOnlyDate = new Date(`1970-01-01T${val.length === 5 ? val + ":00" : val}Z`);
    if (!isNaN(timeOnlyDate.getTime())) {
      return timeOnlyDate;
    }
  }
  return new Date(val);
}

router.get("/", requireAuth, async (req, res) => {
  try {
    const doctors = await prisma.user.findMany({
      where: { role: "DOCTOR" },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        doctorProfile: {
          select: {
            id: true,
            specialization: true,
            licenseNo: true,
            createdAt: true,
            availabilities: true,
          },
        },
      },
    });

    return res.json(doctors);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Failed to fetch doctors" });
  }
});

router.post("/availability", requireAuth, requireRole("DOCTOR"), async (req, res) => {
  try {
    const { dayOfWeek, startTime, endTime } = req.body;

    if (dayOfWeek === undefined || !startTime || !endTime) {
      return res.status(400).json({ error: "dayOfWeek, startTime, and endTime are required" });
    }

    const parsedDay = parseInt(dayOfWeek, 10);
    if (isNaN(parsedDay) || parsedDay < 0 || parsedDay > 6) {
      return res.status(400).json({ error: "dayOfWeek must be an integer between 0 and 6" });
    }

    const parsedStartTime = parseTime(startTime);
    const parsedEndTime = parseTime(endTime);

    if (isNaN(parsedStartTime.getTime()) || isNaN(parsedEndTime.getTime())) {
      return res.status(400).json({ error: "Invalid startTime or endTime format" });
    }

    const doctorProfile = await prisma.doctorProfile.findUnique({
      where: { userId: req.user.id },
    });

    if (!doctorProfile) {
      return res.status(404).json({ error: "Doctor profile not found" });
    }

    const availability = await prisma.availability.create({
      data: {
        doctorId: doctorProfile.id,
        dayOfWeek: parsedDay,
        startTime: parsedStartTime,
        endTime: parsedEndTime,
      },
    });

    return res.status(201).json(availability);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Failed to create availability" });
  }
});

module.exports = router;
