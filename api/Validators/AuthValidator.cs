using api.DTOs;
using FluentValidation;

namespace api.Validators;

public class RegisterDtoValidator : AbstractValidator<RegisterDto>
{
    public RegisterDtoValidator()
    {
        RuleFor(x => x.FullName)
            .NotEmpty()
            .WithMessage("Ad Soyad zorunludur.")
            .MinimumLength(2)
            .WithMessage("Ad Soyad en az 2 karakter olmalıdır.")
            .MaximumLength(100)
            .WithMessage("Ad Soyad en fazla 100 karakter olabilir.");

        RuleFor(x => x.Email)
            .NotEmpty()
            .WithMessage("E-posta zorunludur.")
            .EmailAddress()
            .WithMessage("Geçerli bir e-posta adresi giriniz.");

        RuleFor(x => x.Password)
            .NotEmpty()
            .WithMessage("Şifre zorunludur.")
            .MinimumLength(8)
            .WithMessage("Şifre en az 8 karakter olmalıdır.")
            .Matches("[A-Z]")
            .WithMessage("Şifre en az bir büyük harf içermelidir.")
            .Matches("[0-9]")
            .WithMessage("Şifre en az bir rakam içermelidir.");

        RuleFor(x => x.Phone)
            .NotEmpty()
            .WithMessage("Telefon zorunludur.")
            .Matches(@"^\+?[0-9]{10,15}$")
            .WithMessage("Geçerli bir telefon numarası giriniz.");

        RuleFor(x => x.Role)
            .Must(r => new[] { "Receiver", "Provider" }.Contains(r))
            .WithMessage("Rol Receiver veya Provider olmalıdır.");
    }
}

public class LoginDtoValidator : AbstractValidator<LoginDto>
{
    public LoginDtoValidator()
    {
        RuleFor(x => x.Email)
            .NotEmpty()
            .WithMessage("E-posta zorunludur.")
            .EmailAddress()
            .WithMessage("Geçerli bir e-posta adresi giriniz.");

        RuleFor(x => x.Password).NotEmpty().WithMessage("Şifre zorunludur.");
    }
}
