import Pin from "../models/pin.model.js";
import Board from "../models/board.model.js";
import Imagekit from "imagekit";

// --- ADDED: EXPORTED getPins FUNCTION (Assumed from previous context) ---
export const getPins = async (req, res) => {
    const pageNumber = Number(req.query.cursor) || 0;
    const LIMIT = 21;
    const search = req.query.search;

    const pins = await Pin.find( search
        ? {
            $or: [
              { title: { $regex: search, $options: "i" } },
              { tags: { $in: [search] } },
            ],
          }:{})
      .limit(LIMIT)
      .skip(pageNumber * LIMIT);
  
    const hasNextPage = pins.length === LIMIT;
  
    res
      .status(200)
      .json({ pins, nextCursor: hasNextPage ? pageNumber + 1 : null });
  };
  
// --- ADDED: MISSING getPin FUNCTION (Fixes the SyntaxError) ---
export const getPin = async (req, res) => {
    const { id } = req.params;
    const pin = await Pin.findById(id).populate("user", "userName img displayName");
    res.status(200).json(pin);
};

// --- Your Existing (and now simplified) createPin Function ---
export const createPin = async (req, res) => {
  console.log(req.body);
  try {
    const {
      title,
      description,
      link,
      board,
      tags,
      newBoard,
    } = req.body;

    const media = req.files.media;
    console.log(media);

    if (!title || !description || !media) {
      return res.status(400).json({ message: "Title, description, and media are required!" });
    }

    // 1. HANDLE NEW BOARD CREATION
    let finalBoardId = board;

    if (newBoard) {
      const createdBoard = await Board.create({
        title: newBoard,
        user: req.userId,
      });
      finalBoardId = createdBoard._id;
    }
    
// 2. UPLOAD TO IMAGEKIT
const imagekit = new Imagekit({
  publicKey: process.env.IMAGEKIT_PUBLIC_KEY,
  privateKey: process.env.IMAGEKIT_PRIVATE_KEY,
  urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT,
});

const response = await imagekit.upload({
  file: media.data,
  fileName: media.name,
  folder: "pins",
});

// 3. CREATE THE PIN IN THE DATABASE
const newPin = await Pin.create({
  user: req.userId,
  title,
  description,
  link: link || null,
  board: finalBoardId || null,
  tags: tags ? tags.split(",").map((tag) => tag.trim()) : [],
  media: response.url,
  width: response.width,
  height: response.height,
});


    // 4. SUCCESS RESPONSE (Returns the Pin ID for navigation)
    return res.status(201).json(newPin);

  } catch (err) {
    console.error("Error creating pin:", err);
    return res.status(500).json({ message: "Failed to create pin.", error: err.message });
  }
};