using api.DTOs;
using FluentValidation;

namespace api.Validators;

public class BusinessDtoValidator : AbstractValidator<BusinessDto>
{
    public BusinessDtoValidator()
    {
        RuleFor(x => x.Name)
            .NotEmpty().WithMessage("İşletme adı zorunludur.")
            .MinimumLength(2).WithMessage("İşletme adı en az 2 karakter olmalıdır.")
            .MaximumLength(150).WithMessage("İşletme adı en fazla 150 karakter olabilir.");

        RuleFor(x => x.Address)
            .NotEmpty().WithMessage("Adres zorunludur.")
            .MaximumLength(300).WithMessage("Adres en fazla 300 karakter olabilir.");

        RuleFor(x => x.City)
            .NotEmpty().WithMessage("Şehir zorunludur.")
            .MaximumLength(100).WithMessage("Şehir en fazla 100 karakter olabilir.");

        RuleFor(x => x.Phone)
            .NotEmpty().WithMessage("Telefon zorunludur.")
            .Matches(@"^\+?[0-9]{10,15}$").WithMessage("Geçerli bir telefon numarası giriniz.");

        RuleFor(x => x.Email)
            .EmailAddress().WithMessage("Geçerli bir e-posta adresi giriniz.")
            .When(x => !string.IsNullOrEmpty(x.Email));

        RuleFor(x => x.Website)
            .Must(w => Uri.TryCreate(w, UriKind.Absolute, out _))
            .WithMessage("Geçerli bir URL giriniz.")
            .When(x => !string.IsNullOrEmpty(x.Website));

        RuleFor(x => x.Description)
            .MaximumLength(1000).WithMessage("Açıklama en fazla 1000 karakter olabilir.");
    }
}