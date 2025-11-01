import Board from "../models/board.model.js";
import Pin from "../models/pin.model.js";

export const getUserBoards = async (req, res) => {
  const { userId } = req.params;

  const boards = await Board.find({ user: userId });

  const boardsWithPinDetails = await Promise.all(
    boards.map(async (board) => {
      const pinCount = await Pin.countDocuments({ board: board._id });
      const firstPin = await Pin.findOne({ board: board._id });

      return {
        ...board.toObject(),
        pinCount,
        firstPin,
      };
    })
  );

  res.status(200).json(boardsWithPinDetails);
};
export const getMyBoards = async (req, res) => {
  try {
    // req.userId comes from your verifyToken middleware
    const boards = await Board.find({ user: req.userId }).select("title");

    res.status(200).json(boards);
  } catch (err) {
    res.status(500).json({ message: "Failed to get boards" });
  }
};