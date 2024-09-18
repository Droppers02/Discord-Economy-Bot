const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");
const profileModel = require("../models/profileSchema");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("admin")
    .setDescription("Acess to all admin commands")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addSubcommand((subcommand) =>
      subcommand
        .setName("add")
        .setDescription("Adicionar coins a um utilizador")
        .addUserOption((option) =>
          option
            .setName("user")
            .setDescription("Utilizador a dar as coins")
            .setRequired(true)
        )
        .addIntegerOption((option) =>
          option
            .setName("amount")
            .setDescription("Quantidade de coins a dar")
            .setRequired(true)
            .setMinValue(1)
        )
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("remove")
        .setDescription("Remover coins a um utilizador")
        .addUserOption((option) =>
          option
            .setName("user")
            .setDescription("Utilizador a remover as coins")
            .setRequired(true)
        )
        .addIntegerOption((option) =>
          option
            .setName("amount")
            .setDescription("Quantidade de coins a remover")
            .setRequired(true)
            .setMinValue(1)
        )
    ),
  async execute(interaction) {
    await interaction.deferReply();
    const adminSubcommand = interaction.options.getSubcommand();

    if (adminSubcommand === "add") {
      const user = interaction.options.getUser("user");
      const amount = interaction.options.getInteger("amount");

      await profileModel.findOneAndUpdate(
        {
          userId: user.id,
        },
        {
          $inc: {
            balance: amount,
          },
        }
      );

      await interaction.editReply(
        `Added ${amount} coins to ${user.username}'s balance`
      );
    }

    if (adminSubcommand === "remove") {
      const user = interaction.options.getUser("user");
      const amount = interaction.options.getInteger("amount");

      await profileModel.findOneAndUpdate(
        {
          userId: user.id,
        },
        {
          $inc: {
            balance: -amount,
          },
        }
      );

      await interaction.editReply(
        `Removed ${amount} coins from ${user.username}'s balance`
      );
    }
  },
};
