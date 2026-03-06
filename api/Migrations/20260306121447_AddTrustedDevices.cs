using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace api.Migrations
{
    /// <inheritdoc />
    public partial class AddTrustedDevices : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_TrustedDevice_Users_UserId",
                table: "TrustedDevice");

            migrationBuilder.DropPrimaryKey(
                name: "PK_TrustedDevice",
                table: "TrustedDevice");

            migrationBuilder.RenameTable(
                name: "TrustedDevice",
                newName: "TrustedDevices");

            migrationBuilder.RenameIndex(
                name: "IX_TrustedDevice_UserId",
                table: "TrustedDevices",
                newName: "IX_TrustedDevices_UserId");

            migrationBuilder.AddPrimaryKey(
                name: "PK_TrustedDevices",
                table: "TrustedDevices",
                column: "Id");

            migrationBuilder.CreateIndex(
                name: "IX_TrustedDevices_TokenHash",
                table: "TrustedDevices",
                column: "TokenHash",
                unique: true);

            migrationBuilder.AddForeignKey(
                name: "FK_TrustedDevices_Users_UserId",
                table: "TrustedDevices",
                column: "UserId",
                principalTable: "Users",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_TrustedDevices_Users_UserId",
                table: "TrustedDevices");

            migrationBuilder.DropPrimaryKey(
                name: "PK_TrustedDevices",
                table: "TrustedDevices");

            migrationBuilder.DropIndex(
                name: "IX_TrustedDevices_TokenHash",
                table: "TrustedDevices");

            migrationBuilder.RenameTable(
                name: "TrustedDevices",
                newName: "TrustedDevice");

            migrationBuilder.RenameIndex(
                name: "IX_TrustedDevices_UserId",
                table: "TrustedDevice",
                newName: "IX_TrustedDevice_UserId");

            migrationBuilder.AddPrimaryKey(
                name: "PK_TrustedDevice",
                table: "TrustedDevice",
                column: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_TrustedDevice_Users_UserId",
                table: "TrustedDevice",
                column: "UserId",
                principalTable: "Users",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }
    }
}
