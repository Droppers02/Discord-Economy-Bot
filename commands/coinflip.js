const { SlashCommandBuilder } = require("discord.js");
const { coinflipReward } = require("../globalValues.json");
const profileModel = require("../models/profileSchema");
const parseMilliseconds = require("parse-ms-2");
const { parse } = require("dotenv");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("coinflip")
    .setDescription("Flip a coin for a free bonus")
    .addStringOption((option) =>
      option
        .setName("choice")
        .setDescription("Heads or Tails")
        .setRequired(true)
        .addChoices(
          { name: "Heads", value: "Heads" },
          { name: "Tails", value: "Tails" }
        )
    ),
  async execute(interaction, profileData) {
    const { id } = interaction.user;
    const { coinflipLastUsed } = profileData;

    const cooldown = 14400000; // 4h cooldown
    const timeLeft = cooldown - (Date.now() - coinflipLastUsed);

    if (timeLeft > 0) {
      await interaction.deferReply({ ephemeral: true });
      const { hours, minutes, seconds } = parseMilliseconds(timeLeft);
      return await interaction.editReply(
        `Claim your next coin flip in ${hours}hrs ${minutes}min ${seconds}sec`
      );
    }

    await interaction.deferReply();

    await profileModel.findOneAndUpdate(
      {
        userId: id,
      },
      {
        $set: {
          coinflipLastUsed: Date.now(),
        },
      }
    );

    const randomNum = Math.round(Math.random()); // 0-1 (0.3, 0.78, 0.9111 etc...) a cima de 0.5 é tails, a baixo é heads.
    const result = randomNum ? "Heads" : "Tails";
    const choice = interaction.options.getString("choice");

    if (choice === result) {
      await profileModel.findOneAndUpdate(
        {
          userId: id,
        },
        {
          $inc: {
            balance: coinflipReward,
          },
        }
      );

      await interaction.editReply(
        `Winner! You won ${coinflipReward} coins with **${choice}**.`
      );
    } else {
      await interaction.editReply(
        `Lost... You chose **${choice}** but is was ${result}. Good luck on the next time!`
      );
    }
  },
};
