using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace api.Migrations
{
    /// <inheritdoc />
    public partial class RoleUpdate : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Appointments_Users_ReceiverId",
                table: "Appointments");

            migrationBuilder.RenameColumn(
                name: "ReceiverNotes",
                table: "Appointments",
                newName: "ReceiverNotes");

            migrationBuilder.RenameColumn(
                name: "ReceiverId",
                table: "Appointments",
                newName: "ReceiverId");

            migrationBuilder.RenameIndex(
                name: "IX_Appointments_ReceiverId",
                table: "Appointments",
                newName: "IX_Appointments_ReceiverId");

            migrationBuilder.AddForeignKey(
                name: "FK_Appointments_Users_ReceiverId",
                table: "Appointments",
                column: "ReceiverId",
                principalTable: "Users",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Appointments_Users_ReceiverId",
                table: "Appointments");

            migrationBuilder.RenameColumn(
                name: "ReceiverNotes",
                table: "Appointments",
                newName: "ReceiverNotes");

            migrationBuilder.RenameColumn(
                name: "ReceiverId",
                table: "Appointments",
                newName: "ReceiverId");

            migrationBuilder.RenameIndex(
                name: "IX_Appointments_ReceiverId",
                table: "Appointments",
                newName: "IX_Appointments_ReceiverId");

            migrationBuilder.AddForeignKey(
                name: "FK_Appointments_Users_ReceiverId",
                table: "Appointments",
                column: "ReceiverId",
                principalTable: "Users",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }
    }
}
