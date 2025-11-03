import db from "@/lib/db";

interface DBUser {
    id: number;
    first_name: string;
    last_name: string;
    password: string;
    photo: string | null;
}

export async function POST(req: Request) {
    const body = await req.json().catch(() => ({} as Record<string, unknown>));
    const { first_name, password } = (body ?? {}) as { first_name?: string; password?: string };

    if (!first_name || !password) {
        return new Response(
            JSON.stringify({ success: false, message: "Champs requis manquants (first_name, password)" }),
            { status: 400, headers: { "Content-Type": "application/json" } }
        );
    }

    const user = db
        .prepare("SELECT id, first_name, last_name, password, photo FROM users WHERE first_name = ?")
        .get(first_name) as DBUser | undefined;

    if (!user) {
        return new Response(
            JSON.stringify({ success: false, message: "Utilisateur introuvable" }),
            { status: 404, headers: { "Content-Type": "application/json" } }
        );
    }

    if (user.password !== password) {
        return new Response(
            JSON.stringify({ success: false, message: "Mot de passe incorrect" }),
            { status: 401, headers: { "Content-Type": "application/json" } }
        );
    }

    return new Response(
        JSON.stringify({
            success: true,
            user: {
                id: user.id,
                first_name: user.first_name,
                last_name: user.last_name,
                photo: user.photo,
            },
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
    );
}
