const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const prisma = require("../prismaClient");

const router = express.Router();

const ALLOWED_ROLES = new Set(["PATIENT", "DOCTOR"]);

function stripPassword(user) {
  if (!user) {
    return user;
  }
  const { password, ...safeUser } = user;
  return safeUser;
}

router.post("/register", async (req, res) => {
  try {
    const { name, email, password, role, specialization, licenseNo } = req.body;

    if (!name || !email || !password || !role) {
      return res.status(400).json({
        error: "name, email, password, and role are required",
      });
    }

    if (!ALLOWED_ROLES.has(role)) {
      return res.status(400).json({
        error: "role must be PATIENT or DOCTOR",
      });
    }

    if (role === "DOCTOR" && (!specialization || !licenseNo)) {
      return res.status(400).json({
        error: "specialization and licenseNo are required for DOCTOR role",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role,
        ...(role === "DOCTOR"
          ? {
              doctorProfile: {
                create: {
                  specialization,
                  licenseNo,
                },
              },
            }
          : {}),
      },
      include: {
        doctorProfile: true,
      },
    });

    return res.status(201).json(stripPassword(user));
  } catch (error) {
    if (error.code === "P2002") {
      return res.status(409).json({ error: "Email or license number already exists" });
    }
    console.error(error);
    return res.status(500).json({ error: "Registration failed" });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "email and password are required" });
    }

    const user = await prisma.user.findUnique({
      where: { email },
      include: { doctorProfile: true },
    });

    if (!user) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const passwordMatches = await bcrypt.compare(password, user.password);
    if (!passwordMatches) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const token = jwt.sign(
      { id: user.id, role: user.role, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: "8h" }
    );

    return res.json({
      token,
      user: stripPassword(user),
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Login failed" });
  }
});

module.exports = router;
