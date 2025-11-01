import Comment from "../models/comment.model.js";
import User from "../models/user.model.js";
import mongoose from "mongoose"; // Import mongoose

export const getPostComments = async (req, res) => {
  try { // <-- Add try
    const { postId } = req.params;

    // (Optional) Add a check for a valid ID
    if (!mongoose.Types.ObjectId.isValid(postId)) {
      return res.status(400).json({ message: "Invalid Post ID" });
    }

    const comments = await Comment.find({ pin: postId })
      .populate("user", "username img displayName")
      .sort({ createdAt: -1 });

    res.status(200).json(comments);

  } catch (error) { // <-- Add catch
    console.log(error); // Log the error for debugging
    res.status(500).json({ message: "Failed to get comments", error: error.message });
  }
};

export const addComment = async (req, res) => {
  try { // <-- Add try
    const { description, pin } = req.body;
    const userId = req.userId;

    const comment = await Comment.create({ description, pin, user: userId });

    // Populate the new comment with user info before sending it back
    const newComment = await Comment.findById(comment._id)
                                  .populate("user", "username img displayName");

    res.status(201).json(newComment);

  } catch (error) { // <-- Add catch
    console.log(error);
    res.status(500).json({ message: "Failed to add comment", error: error.message });
  }
};