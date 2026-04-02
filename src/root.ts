import express, { Request, Response } from "express";
import dotenv from "dotenv";

dotenv.config();

const app = express();

const port = 8000;

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.post("/container-up", async (req: Request, res: Response) => {
    const { image, cmd = null } = await req.body;

    return res.status(200).json({
        image,
        cmd,
    });
})

app.listen(port, () => {
    console.log(`Server is running on port: ${port}`);
});