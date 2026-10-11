import type { Request, Response, NextFunction } from "express";
import User from "../models/user.model.ts";
import { hashPassword, comparePassword } from "../utils/password.util.ts";
import { generateToken } from "../utils/jwt.util.ts";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// POST /api/auth/register — Public — Create new account
export const register = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { name, email, password, phone } = req.body;

    if (!name || !email || !password) {
      res.status(400).json({ success: false, message: "Name, email, and password are required." });
      return;
    }

    const trimmedEmail = String(email).trim().toLowerCase();
    if (!EMAIL_REGEX.test(trimmedEmail)) {
      res.status(400).json({ success: false, message: "Please provide a valid email address." });
      return;
    }

    if (password.length < 6) {
      res.status(400).json({ success: false, message: "Password must be at least 6 characters." });
      return;
    }

    console.log(`[AUTH] Registration attempt for: ${trimmedEmail}`);

    const existingUser = await User.findOne({ email: trimmedEmail });
    if (existingUser) {
      console.warn(`[AUTH] Registration rejected: ${trimmedEmail} already exists`);
      res.status(409).json({ success: false, message: "An account with this email already exists." });
      return;
    }

    const hashedPassword = await hashPassword(password);
    const userData: { name: string; email: string; password: string; phone?: string } = {
      name: String(name).trim(),
      email: trimmedEmail,
      password: hashedPassword,
    };
    if (phone) {
      userData.phone = String(phone).trim();
    }
    const user = await User.create(userData);

    const token = generateToken({ userId: user._id.toString(), email: user.email });

    console.log(`[AUTH] Registration successful for: ${trimmedEmail}`);

    res.status(201).json({
      success: true,
      message: "Account created successfully.",
      data: {
        token,
        user: { id: user._id, name: user.name, email: user.email, phone: user.phone },
      },
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/auth/login — Public — Verify credentials, return JWT
export const login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ success: false, message: "Email and password are required." });
      return;
    }

    const trimmedEmail = String(email).trim().toLowerCase();
    if (!EMAIL_REGEX.test(trimmedEmail)) {
      res.status(400).json({ success: false, message: "Please provide a valid email address." });
      return;
    }

    console.log(`[AUTH] Login attempt for: ${trimmedEmail}`);

    const user = await User.findOne({ email: trimmedEmail });
    if (!user) {
      console.warn(`[AUTH] Login failed: User not found for ${trimmedEmail}`);
      res.status(401).json({ success: false, message: "Invalid email or password." });
      return;
    }

    const isPasswordValid = await comparePassword(password, user.password);
    if (!isPasswordValid) {
      console.warn(`[AUTH] Login failed: Invalid password for ${trimmedEmail}`);
      res.status(401).json({ success: false, message: "Invalid email or password." });
      return;
    }

    const token = generateToken({ userId: user._id.toString(), email: user.email });

    console.log(`[AUTH] Login successful for: ${trimmedEmail}`);

    res.status(200).json({
      success: true,
      message: "Login successful.",
      data: {
        token,
        user: { id: user._id, name: user.name, email: user.email, phone: user.phone },
      },
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/auth/me — Protected — Return current user profile
export const getMe = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const currentUser = (req as any).user;

    if (!currentUser) {
      res.status(401).json({ success: false, message: "Not authenticated." });
      return;
    }

    const user = await User.findById(currentUser.userId).select("-password");
    if (!user) {
      res.status(404).json({ success: false, message: "User not found." });
      return;
    }

    res.status(200).json({
      success: true,
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          created_at: user.created_at,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};