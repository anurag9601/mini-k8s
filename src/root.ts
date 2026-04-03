import express, { Request, Response } from "express";
import dotenv from "dotenv";
import containerTable from "./db/schema";
import db from "./db";

dotenv.config();

const app = express();

const port = 8000;

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.post("/container-up", async (req: Request, res: Response) => {
    const { image, cmd = null } = await req.body;

    if (!image) {
        return res.json({ error: "Image name is required for spinning a container." }).status(400);
    };

    const [insertData] = await db.insert(containerTable).values({
        image: image,
        cmd: cmd
    }).returning({
        id: containerTable.id
    });

    return res.json({ id: insertData.id }).status(200);
})

app.listen(port, () => {
    console.log(`Server is running on port: ${port}`);
});