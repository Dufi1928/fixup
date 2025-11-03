import { writeFile, mkdir } from "fs/promises";
import path from "path";

// Types de fichiers autorisés pour les photos
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp"];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

export async function POST(req: Request) {
    try {
        const formData = await req.formData();
        const file = formData.get("file") as File;

        if (!file) {
            return new Response(
                JSON.stringify({ error: "Aucun fichier fourni" }),
                { status: 400, headers: { "Content-Type": "application/json" } }
            );
        }

        // Validation du type de fichier
        if (!ALLOWED_TYPES.includes(file.type)) {
            return new Response(
                JSON.stringify({ error: "Type de fichier non autorisé. Utilisez JPG, PNG, GIF ou WebP." }),
                { status: 400, headers: { "Content-Type": "application/json" } }
            );
        }

        // Validation de la taille
        if (file.size > MAX_FILE_SIZE) {
            return new Response(
                JSON.stringify({ error: "Fichier trop volumineux. Taille maximale : 5MB" }),
                { status: 400, headers: { "Content-Type": "application/json" } }
            );
        }

        // Créer le dossier uploads s'il n'existe pas
        const uploadsDir = path.join(process.cwd(), "public/uploads");
        await mkdir(uploadsDir, { recursive: true });

        // Sauvegarder le fichier
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const filename = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, "_")}`;
        const filepath = path.join(uploadsDir, filename);

        await writeFile(filepath, buffer);

        return new Response(
            JSON.stringify({ url: `/uploads/${filename}` }),
            { status: 200, headers: { "Content-Type": "application/json" } }
        );
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Erreur inconnue";
        return new Response(
            JSON.stringify({ error: "Erreur lors de l'upload", details: errorMessage }),
            { status: 500, headers: { "Content-Type": "application/json" } }
        );
    }
}
