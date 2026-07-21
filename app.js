const express = require("express");
const cors = require("cors");

const courses = require("./data/courses");

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req,res) => {
    res.send("Backend is running!");
});

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
app.put("/api/courses/:id", (req, res) => {

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
app.delete("/api/courses/:id", (req, res) => {

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
app.post("/api/courses", (req,res) => {
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


const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});