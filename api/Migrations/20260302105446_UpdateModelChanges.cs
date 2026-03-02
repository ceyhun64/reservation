using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace api.Migrations
{
    /// <inheritdoc />
    public partial class UpdateModelChanges : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Businesses_Users_OwnerId",
                table: "Businesses");

            migrationBuilder.DropForeignKey(
                name: "FK_Providers_Businesses_BusinessId",
                table: "Providers");

            migrationBuilder.DropTable(
                name: "ProviderServices");

            migrationBuilder.DropIndex(
                name: "IX_Providers_BusinessId",
                table: "Providers");

            migrationBuilder.DropColumn(
                name: "BusinessId",
                table: "Providers");

            migrationBuilder.RenameColumn(
                name: "OwnerId",
                table: "Businesses",
                newName: "ProviderId");

            migrationBuilder.RenameIndex(
                name: "IX_Businesses_OwnerId",
                table: "Businesses",
                newName: "IX_Businesses_ProviderId");

            migrationBuilder.AddForeignKey(
                name: "FK_Businesses_Providers_ProviderId",
                table: "Businesses",
                column: "ProviderId",
                principalTable: "Providers",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Businesses_Providers_ProviderId",
                table: "Businesses");

            migrationBuilder.RenameColumn(
                name: "ProviderId",
                table: "Businesses",
                newName: "OwnerId");

            migrationBuilder.RenameIndex(
                name: "IX_Businesses_ProviderId",
                table: "Businesses",
                newName: "IX_Businesses_OwnerId");

            migrationBuilder.AddColumn<int>(
                name: "BusinessId",
                table: "Providers",
                type: "integer",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "ProviderServices",
                columns: table => new
                {
                    ProviderId = table.Column<int>(type: "integer", nullable: false),
                    ServiceId = table.Column<int>(type: "integer", nullable: false),
                    CustomDurationMinutes = table.Column<int>(type: "integer", nullable: true),
                    CustomPrice = table.Column<decimal>(type: "numeric", nullable: true),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ProviderServices", x => new { x.ProviderId, x.ServiceId });
                    table.ForeignKey(
                        name: "FK_ProviderServices_Providers_ProviderId",
                        column: x => x.ProviderId,
                        principalTable: "Providers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_ProviderServices_Services_ServiceId",
                        column: x => x.ServiceId,
                        principalTable: "Services",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Providers_BusinessId",
                table: "Providers",
                column: "BusinessId");

            migrationBuilder.CreateIndex(
                name: "IX_ProviderServices_ServiceId",
                table: "ProviderServices",
                column: "ServiceId");

            migrationBuilder.AddForeignKey(
                name: "FK_Businesses_Users_OwnerId",
                table: "Businesses",
                column: "OwnerId",
                principalTable: "Users",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_Providers_Businesses_BusinessId",
                table: "Providers",
                column: "BusinessId",
                principalTable: "Businesses",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);
        }
    }
}
