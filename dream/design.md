# Database Relation Design

User ->
 // The list of all top level owned projected.
 * ownedProjects: Project[]
 // The list of all projects where the user has been invited to participate.
 * joinedProjects: Project[]
 // All the dreams the user has created across all owned and joined projects.
 * dreams: Dream[]

Project -> 
  // All the dreams users have created.
  * dreams Dream[]
  // Backlink to the owner user.
  * owner: User
  // Backlink to all the joined users.
  * members: User[]

Dream ->
  // Backlink to the owning project.
  * project: Project
  // The user that created the dream.
  * owner: User
