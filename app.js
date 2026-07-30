require("dotenv").config();

const express = require("express");
const cors = require("cors");
const jwt = require("jwt-simple");

const SECRET = process.env.JWT_SECRET;

const courses = require("./data/courses");
const users = require("./data/users");
const cart = require("./data/cart");

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req,res) => {
    res.send("Backend is running!");
});

// LOGIN
app.post("/api/login", (req,res) => {
    const {username,password} = req.body;
    const user = users.find(
        user => user.username === username &&
        user.password === password
    );

    if (!user) {
        return res.status(401).json({error: "Invalid username or password"})
        }

    const payload = {
        id: user.id,
        username: user.username,
        role: user.role,
        exp: Math.floor(Date.now() / 1000) + (60 * 60)
    };

    const token = jwt.encode(payload, SECRET);

    res.json({
        token: token,
        role: user.role
    });
});

// STUDENT CART CHECK
function studentOnly(req,res,next) {
    if(req.user.role !== "student"){
        return res.status(401).json({
            error:"Students only"
        });
    }

    next();
}

// CHECK JWT TOKEN
function authenticate(req, res, next) {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
        return res.status(401).json({error: "No token provided"})
    }

    const token = authHeader.split(" ")[1];

    try {
        const decoded = jwt.decode(token, SECRET);

        if (decoded.exp < Date.now() / 1000) {
            return res.status(401).json({error: "Token expired"})
        }

        req.user = decoded;

        next();
    } catch(error) {
        return res.status(401).json({error: "Invalid token"})
    }
}

// TEACHER AUTHORIZATION
function teacherOnly(req, res, next) {
    if (req.user.role !== "teacher") {
        return res.status(401).json({error: "Teachers only"})
    }

    next();
}

// GET all courses
app.get("/api/courses", (req,res) => {
    res.json(courses);
});

//GET one course by ID
app.get("/api/courses/:id", (req, res) => {

    const id = Number(req.params.id);

    const course = courses.find(course => course.id === id);

    if (!course) {
        return res.status(404).json({
            message: "Course not found"
        });
    }

    res.json(course);
});

// UPDATE a course
app.put("/api/courses/:id", authenticate, teacherOnly, (req, res) => {

    const id = Number(req.params.id);

    const course = courses.find(course => course.id === id);

    if (!course) {
        return res.status(404).json({
            message: "Course not found"
        });
    }

    course.subject = req.body.subject;
    course.number = req.body.number;
    course.name = req.body.name;
    course.credits = req.body.credits;
    course.description = req.body.description;

    res.json(course);
});

// DELETE a course
app.delete("/api/courses/:id", authenticate, teacherOnly, (req, res) => {

    const id = Number(req.params.id);

    const index = courses.findIndex(course => course.id === id);

    if (index === -1) {
        return res.status(404).json({
            message: "Course not found"
        });
    }

    const deletedCourse = courses.splice(index, 1);

    res.json(deletedCourse[0]);
});

// CREATE a course
app.post("/api/courses", authenticate, teacherOnly, (req, res) => {
    const newCourse = {
        id: courses.length + 1,
        subject: req.body.subject,
        number: req.body.number,
        name: req.body.name,
        credits: req.body.credits,
        description: req.body.description
    };

    courses.push(newCourse);

    res.status(201).json(newCourse);
});

// GET LOGGED-IN STUDENT'S CART
app.get("/api/cart", authenticate, studentOnly, (req,res)=>{
    const studentCart = cart.filter(
        item => item.studentId === req.user.id
    );

    res.json(studentCart);
});

// ADD COURSE TO STUDENT'S CART
app.post("/api/cart", authenticate, studentOnly, (req,res)=>{

    const existingItem = cart.find(
        item =>
            item.studentId === req.user.id &&
            item.courseId === req.body.courseId
    );

    if(existingItem) {
        return res.status(400).json({
            message:"Course already in cart"
        });
    }

    const newItem = {
        id: cart.length + 1,
        studentId: req.user.id,
        courseId: req.body.courseId
    };

    cart.push(newItem);

    res.status(201).json(newItem);
});

// REMOVE COURSE FROM STUDENT'S CART
app.delete("/api/cart/:id", authenticate, studentOnly, (req,res)=>{
    const id = Number(req.params.id);

    const index = cart.findIndex(
        item =>
            item.id === id &&
            item.studentId === req.user.id
    );

    if(index === -1) {
        return res.status(404).json({
            message:"Cart item not found"
        });
    }

    cart.splice(index,1);

    res.json({
        message:"Course removed from cart"
    });
});


const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});