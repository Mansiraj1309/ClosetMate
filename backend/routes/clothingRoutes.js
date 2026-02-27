const express = require("express");
const router = express.Router();
const Clothing = require("../models/Clothing");

// Add clothing
router.post("/add", async (req,res)=>{
    try{
        const item = new Clothing(req.body);
        await item.save();
        res.json({message:"Clothing added", item});
    }catch(err){
        res.status(500).json(err);
    }
});

// Get all clothes
router.get("/all", async(req,res)=>{
    const items = await Clothing.find();
    res.json(items);
});

module.exports = router;