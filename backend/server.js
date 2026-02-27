const clothingRoutes = require("./routes/clothingRoutes");

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

app.use("/api/clothes", clothingRoutes);

mongoose.connect("mongodb://127.0.0.1:27017/closetmate")
.then(()=>console.log("MongoDB Connected"))
.catch(err=>console.log(err));

app.get("/", (req,res)=>{
    res.send("ClosetMate API Running");
});

app.listen(5050, ()=>{
    console.log("Server running on port 5050");
});

