import express from "express";
// 1. Import the missing controller function
import { getPins, getPin, createPin } from "../controllers/pin.controller.js"; 
import { verifyToken } from "../middlewares/verifyToken.js"; // Import your authentication middleware

const Router = express.Router();

// Route to GET all pins (read/homepage)
Router.get("/", getPins);

// Route to POST a new pin (create/publish)
Router.post("/", verifyToken, createPin); // <-- THIS IS THE MISSING LINE

// Route to GET a single pin (read detail page)
Router.get("/:id", getPin);

export default Router;