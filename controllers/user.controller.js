import User from "../models/user.model.js";
import Follow from "../models/follow.model.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import Imagekit from "imagekit"; // <-- This is the only ImageKit import needed

export const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.userId).select("-hashedPassword");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.status(200).json(user);
  } catch (error) {
    console.error("GET ME ERROR:", error);
    next(error);
  }
};

// This updates the user's profile
export const updateMe = async (req, res, next) => {
  try {
    const { displayName, userName } = req.body;
    const userId = req.userId; // From verifyToken

    let updateData = { displayName, userName };

    // Check if a file was uploaded
    if (req.files && req.files.profileImage) {
      const file = req.files.profileImage;

      // --- 1. Initialize ImageKit here (like in your createPin) ---
      const imagekit = new Imagekit({
        publicKey: process.env.IMAGEKIT_PUBLIC_KEY,
        privateKey: process.env.IMAGEKIT_PRIVATE_KEY,
        urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT,
      });

      // 2. UPLOAD TO IMAGEKIT
      const result = await imagekit.upload({
        file: file.data, // Using file.data (Buffer)
        fileName: file.name, // Using file.name
        folder: "/moodly-profile-pics/",
      });

      // 3. Add the secure URL to our update data
      updateData.img = result.url;
    }

    // 4. Find the user and update them in MongoDB
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $set: updateData },
      { new: true, runValidators: true }
    ).select("-hashedPassword");

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    // 5. Send the updated user back to the frontend
    res.status(200).json(updatedUser);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ message: "Username already taken!" });
    }
    console.error("UPDATE ME ERROR:", error);
    next(error);
  }
};

export const registerUser = async (req, res, next) => {
  console.log("REGISTER BODY:", req.body);
  const { userName, displayName, email, password } = req.body;

  try {
    if (!userName || !email || !password) {
      return res.status(400).json({ message: "All fields are required!" });
    }

    const existingUser = await User.findOne({ $or: [{ email }, { userName }] });
    if (existingUser) {
      return res
        .status(409)
        .json({ message: "Username or email already exists!" });
    }

    const newHashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      userName,
      displayName,
      email,
      hashedPassword: newHashedPassword,
    });

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET);

    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 30 * 24 * 60 * 60 * 1000,
    });

    const { hashedPassword, ...detailsWithoutPassword } = user.toObject();

    res.status(201).json(detailsWithoutPassword);
  } catch (error) {
    console.error("REGISTER ERROR:", error);
    next(error);
  }
};

export const loginUser = async (req, res, next) => {
  const { email, password } = req.body;

  try {
    if (!email || !password) {
      return res.status(400).json({ message: "All fields are required!" });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const isPasswordCorrect = await bcrypt.compare(
      password,
      user.hashedPassword
    );

    if (!isPasswordCorrect) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET);

    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 30 * 24 * 60 * 60 * 1000,
    });

    const { hashedPassword, ...detailsWithoutPassword } = user.toObject();

    res.status(200).json(detailsWithoutPassword);
  } catch (error) {
    console.error("LOGIN ERROR:", error);
    next(error);
  }
};

export const logoutUser = async (req, res) => {
  res.clearCookie("token");
  res.status(200).json({ message: "Logout successful" });
};

export const getUser = async (req, res, next) => {
  const { username } = req.params;

  try {
    const user = await User.findOne({ userName: username });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const { hashedPassword, ...detailsWithoutPassword } = user.toObject();

    const followerCount = await Follow.countDocuments({ following: user._id });
    const followingCount = await Follow.countDocuments({ follower: user._id });

    const token = req.cookies.token;

    if (!token) {
      return res.status(200).json({
        ...detailsWithoutPassword,
        followerCount,
        followingCount,
        isFollowing: false,
      });
    } else {
      jwt.verify(token, process.env.JWT_SECRET, async (err, payload) => {
        if (err) {
          // If token is invalid, just return public data
          return res.status(200).json({
            ...detailsWithoutPassword,
            followerCount,
            followingCount,
            isFollowing: false,
          });
        }

        const isExists = await Follow.exists({
          follower: payload.userId,
          following: user._id,
        });

        res.status(200).json({
          ...detailsWithoutPassword,
          followerCount,
          followingCount,
          isFollowing: isExists ? true : false,
        });
      });
    }
  } catch (error) {
    console.error("GET USER ERROR:", error);
    next(error);
  }
};

export const followUser = async (req, res, next) => {
  const { username } = req.params;

  try {
    const user = await User.findOne({ userName: username });

    if (!user) {
      return res.status(404).json({ message: "User to follow not found" });
    }

    const isFollowing = await Follow.exists({
      follower: req.userId,
      following: user._id,
    });

    if (isFollowing) {
      await Follow.deleteOne({ follower: req.userId, following: user._id });
    } else {
      await Follow.create({ follower: req.userId, following: user._id });
    }

    res.status(200).json({ message: "Successful" });
  } catch (error) {
    console.error("FOLLOW USER ERROR:", error);
    next(error);
  }
};