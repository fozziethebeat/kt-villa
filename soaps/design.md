# Soaps App Design Document

## Goals
The Soaps app is a tool for a home soap maker to track their cold process soap batches and share details with friends who receive them.

## Core Features
1.  **Batch Tracking**:
    *   Track key dates: Start, Cure (approx 4-6 weeks after start), Cut, Ready/Wrapped.
    *   Custom naming for each batch.
    *   Link to a specific Recipe.
    *   Status visualization (e.g., progress bar for curing).
2.  **Recipe Management**:
    *   Store reusable recipes (Ingredients, Instructions).
    *   Batches are instances of a recipe.
3.  **Visuals**:
    *   Generate custom AI images for each batch (using Google GenAI/Imagen).
4.  **Social/Sharing**:
    *   Friends can log in via magic link.
    *   Maker can "gift" a soap to a friend (via email).
    *   Friends can view their "Collection" of soaps with full details (recipe, dates, story).

## User Roles
*   **Maker (Admin)**: Can create recipes, start batches, update statuses, generate images, and assign gifts.
*   **Friend (User)**: Can view their gifted soaps.

## Data Model (Prisma Schema Updates)

### existing models
*   `User`: Identity and Authentication.
*   `Verification`: For magic links.

### New Models
*   `Recipe`
    *   `id`: UUID
    *   `name`: String
    *   `ingredients`: Json (List of items + quantities)
    *   `instructions`: Text/Markdown
    *   `notes`: Text
    *   `createdAt`: DateTime
*   `Batch`
    *   `id`: UUID
    *   `name`: String (Custom name)
    *   `recipeId`: Relation to Recipe
    *   `startedAt`: DateTime
    *   `cutAt`: DateTime?
    *   `readyAt`: DateTime? (Cured and Wrapped)
    *   `imageUrl`: String? (AI Generated)
    *   `notes`: Text
    *   `status`: Enum (STARTED, CURING, READY, ARCHIVED)
*   `SoapGift`
    *   `id`: UUID
    *   `batchId`: Relation to Batch
    *   `userId`: Relation to User (The recipient)
    *   `givenAt`: DateTime @default(now())
    *   `note`: String? (Personal note to friend)

## Page Structure / Routing

### Public / Auth
*   `/login`: Magic link login.

### Maker (Admin) Views
*   `/admin/dashboard`: Overview of active batches (Curing progress).
*   `/admin/recipes`: List of recipes.
*   `/admin/recipes/new`: Create recipe.
*   `/admin/batches`: List of all batches.
*   `/admin/batches/new`: Start a new batch (Select Recipe, Name, Date).
*   `/admin/batches/[id]`:
    *   Update dates/status.
    *   **Action**: Generate AI Image.
    *   **Action**: Gift to Friend (Input email -> Creates `SoapGift` record).

### Friend Views
*   `/collection`: Gallery of soaps the user has received.
*   `/collection/[batchId]`: Public-facing view of a specific soap batch (Image, Story/Description, Ingredients summary).

## Visual Style
*   **Theme**: Clean, artisanal, organic feel.
*   **Colors**: Pastels, earth tones, soft whites/creams.
*   **Aesthetics**: Glassmorphism cards for batches, high-quality typography (Serif for headings).

## AI Integration
*   Use `imageGenerator` (Google GenAI) to create a label/art for the soap based on its name and main ingredients.
