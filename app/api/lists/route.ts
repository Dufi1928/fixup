import db from "@/lib/db";
import { initDatabase } from "@/lib/init-db";

initDatabase();

// GET /api/lists?userId=123 — récupérer toutes les listes d'un utilisateur
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return new Response(
        JSON.stringify({ error: "userId requis" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const lists = db
      .prepare(
        `SELECT el.*,
         GROUP_CONCAT(u.first_name || ' ' || u.last_name, ', ') as members
         FROM expense_lists el
         INNER JOIN list_members lm ON el.id = lm.list_id
         LEFT JOIN list_members lm2 ON el.id = lm2.list_id
         LEFT JOIN users u ON lm2.user_id = u.id
         WHERE lm.user_id = ?
         GROUP BY el.id
         ORDER BY el.created_at DESC`
      )
      .all(userId);

    return new Response(JSON.stringify(lists), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (e) {
    const errorMessage = e instanceof Error ? e.message : "Erreur inconnue";
    return new Response(
      JSON.stringify({ error: "Erreur lors de la récupération des listes", details: errorMessage }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}

// POST /api/lists — créer une nouvelle liste
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, userIds } = body ?? {};

    if (!name || !userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return new Response(
        JSON.stringify({ error: "Nom et userIds (tableau) requis" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Créer la liste
    const stmt = db.prepare("INSERT INTO expense_lists (name) VALUES (?)");
    const info = stmt.run(name);
    const listId = info.lastInsertRowid as number;

    // Ajouter les membres
    const addMemberStmt = db.prepare(
      "INSERT INTO list_members (list_id, user_id) VALUES (?, ?)"
    );

    for (const userId of userIds) {
      addMemberStmt.run(listId, userId);
    }

    const created = db
      .prepare("SELECT * FROM expense_lists WHERE id = ?")
      .get(listId);

    return new Response(JSON.stringify(created), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  } catch (e) {
    const errorMessage = e instanceof Error ? e.message : "Erreur inconnue";
    return new Response(
      JSON.stringify({ error: "Erreur lors de la création de la liste", details: errorMessage }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
