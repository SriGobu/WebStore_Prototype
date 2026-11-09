/**
 * dataHandlingContent
 *
 * Single source of truth for how the app explains its account-deletion
 * data handling — used in both the Privacy Policy (AboutLegal) and the
 * Delete Account confirmation modal, so the two never drift out of
 * sync with each other.
 */
const dataHandlingContent = {
  heading: "How We Handle Your Data",
  sections: [
    {
      title: "What gets permanently deleted",
      body: "When you delete your account, your profile, email, password, wishlist, support tickets, developer applications, and your visited/installed website history are permanently and immediately removed from our systems.",
    },
    {
      title: "What happens to your reviews and replies",
      body: 'By default, your reviews and replies remain visible after account deletion, since they help keep ratings accurate and useful for other users. Your name and email are replaced with "Deleted User" and "deleted@user.com" as placeholders — this content is no longer linked to your identity in any way.',
    },
    {
      title: "Choosing to delete your reviews and replies",
      body: "If you instead choose to permanently delete your reviews and replies at the time of account deletion, this is final. Even if you create a new account later, including with the same email address, deleted reviews and replies cannot be recovered or restored under any account.",
    },
  ],
};

export default dataHandlingContent;
