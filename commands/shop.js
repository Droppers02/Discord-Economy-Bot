const { SlashCommandBuilder } = require("discord.js");
const profileModel = require("../models/profileSchema");
const { customRoleCost, customRoleEditCost } = require("../shopPrices.json");

// Function to convert hexadecimal color string to decimal RGB value
function hexToRgb(hex) {
  // Remove the leading '#' if it exists
  hex = hex.replace(/^#/, "");

  // Convert each pair of hexadecimal digits to decimal and return as an object
  return {
    r: parseInt(hex.substring(0, 2), 16),
    g: parseInt(hex.substring(2, 4), 16),
    b: parseInt(hex.substring(4, 6), 16),
  };
}

// Mapping of color names to hexadecimal values
const colorMap = {
  Purple: "190436",
  Pink: "FF00D4",
  Cyan: "00FFFF",
  Green: "0E5216",
  Brown: "422005",
  Gold: "FFD700",
  Crimson: "DC143C",
  Chartreuse: "7FFF00",
  Teal: "008080",
  Beige: "FFE4B5",
};

module.exports = {
  data: new SlashCommandBuilder()
    .setName("shop")
    .setDescription("A shop where you can spend your coins.")
    .addSubcommand((subcommand) =>
      subcommand
        .setName("custom-role")
        .setDescription(`Buy or edit a custom role for your coins`)
        .addStringOption((option) =>
          option
            .setName("action")
            .setDescription("Choose to edit or buy a custom role")
            .addChoices(
              { name: `Buy Role (${customRoleCost} coins)`, value: "buy" },
              {
                name: `Edit Role (${customRoleEditCost} coins)`,
                value: "edit",
              }
            )
            .setRequired(true)
        )
        .addStringOption((option) =>
          option
            .setName("name")
            .setDescription("Choose the name of your role")
            .setMinLength(1)
            .setMaxLength(16)
            .setRequired(true)
        )
        .addStringOption((option) =>
          option
            .setName("color")
            .setDescription("Choose the color of your role")
            .addChoices(
              { name: "Purple", value: "Purple" },
              { name: "Pink", value: "Pink" },
              { name: "Cyan", value: "Cyan" },
              { name: "Green", value: "Green" },
              { name: "Brown", value: "Brown" },
              { name: "Gold", value: "Gold" },
              { name: "Crimson", value: "Crimson" },
              { name: "Chartreuse", value: "Chartreuse" },
              { name: "Teal", value: "Teal" },
              { name: "Beige", value: "Beige" }
            )
            .setRequired(true)
        )
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("custom-role-remove")
        .setDescription("Delete your current custom role (FREE)")
    ),
  async execute(interaction, profileData) {
    const { balance, userId, customRoleId } = profileData;
    const shopCommand = interaction.options.getSubcommand();

    if (shopCommand === "custom-role") {
      const action = interaction.options.getString("action");
      const name = interaction.options.getString("name");
      const colorName = interaction.options.getString("color");
      const colorHex = colorMap[colorName];

      const colorRgb = hexToRgb(colorHex);
      const color = colorRgb.r * 65536 + colorRgb.g * 256 + colorRgb.b;

      if (action === "edit") {
        if (customRoleId === "") {
          await interaction.deferReply({ ephemeral: true });
          return await interaction.editReply(
            " You need to buy a custom role first!"
          );
        } else if (balance < customRoleEditCost) {
          await interaction.deferReply({ ephemeral: true });
          return await interaction.editReply(
            `You need ${customRoleEditCost} coins to edit a custom role`
          );
        }

        await interaction.deferReply();

        const customRole = await interaction.guild.roles.fetch(customRoleId);

        customRole.edit({ name, color });

        await profileModel.findOneAndUpdate(
          {
            userId,
          },
          {
            $inc: {
              balance: -customRoleEditCost,
            },
          }
        );

        await interaction.editReply("Successfully edited your custom role!");
      }

      if (action === "buy") {
        if (customRoleId !== "") {
          await interaction.deferReply({ ephemeral: true });
          return await interaction.editReply(
            "You already have a custom role... If you want you can edit it!"
          );
        } else if (balance < customRoleCost) {
          await interaction.deferReply({ ephemeral: true });
          return await interaction.editReply(
            `You need ${customRoleCost} coins to buy a custom role`
          );
        }

        await interaction.deferReply();

        const customRole = await interaction.guild.roles.create({
          name,
          permissions: [],
          color,
        });

        interaction.member.roles.add(customRole);

        await profileModel.findOneAndUpdate(
          {
            userId,
          },
          {
            $set: {
              customRoleId: customRole.id,
            },
            $inc: {
              balance: -customRoleCost,
            },
          }
        );

        await interaction.editReply("Successfully purchased a custom role!");
      }
    }

    if (shopCommand === "custom-role-remove") {
      if (customRoleId === "") {
        await interaction.deferReply({ ephemeral: true });
        return await interaction.editReply(" You do not have a custom role!");
      }

      await interaction.deferReply();

      const customRole = await interaction.guild.roles.fetch(customRoleId);

      customRole.delete();

      await profileModel.findOneAndUpdate(
        {
          userId,
        },
        {
          $set: {
            customRoleId: "",
          },
        }
      );

      await interaction.editReply("Your custom role has been deleted.");
    }
  },
};
