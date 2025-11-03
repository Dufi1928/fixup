import db from "@/lib/db";
import { initDatabase } from "@/lib/init-db";

// Initialiser la DB au premier appel
initDatabase();

// GET /api/users — liste des utilisateurs (sans mot de passe)
export async function GET() {
  try {
    const rows = db
      .prepare(
        "SELECT id, first_name, last_name, photo FROM users ORDER BY id DESC"
      )
      .all();

    return new Response(JSON.stringify(rows), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (e) {
    const errorMessage = e instanceof Error ? e.message : "Erreur inconnue";
    return new Response(
      JSON.stringify({ error: "Erreur lors de la récupération des utilisateurs", details: errorMessage }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}

// POST /api/users — création d'un utilisateur
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { first_name, last_name, password, photo } = body ?? {};

    if (!first_name || !last_name || !password) {
      return new Response(
        JSON.stringify({ error: "Champs requis manquants (first_name, last_name, password)" }),
        { status: 400 }
      );
    }

    const stmt = db.prepare(
      "INSERT INTO users (first_name, last_name, password, photo) VALUES (?, ?, ?, ?)"
    );
    const info = stmt.run(first_name, last_name, password, photo ?? null);

    const created = db
      .prepare("SELECT id, first_name, last_name, photo FROM users WHERE id = ?")
      .get(info.lastInsertRowid as number);

    return new Response(JSON.stringify(created), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  } catch (e) {
    const errorMessage = e instanceof Error ? e.message : "Erreur inconnue";
    return new Response(
      JSON.stringify({ error: "Erreur lors de la création de l'utilisateur", details: errorMessage }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
