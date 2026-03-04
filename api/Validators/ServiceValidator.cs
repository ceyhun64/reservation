using api.DTOs;
using FluentValidation;

namespace api.Validators;

public class ServiceDtoValidator : AbstractValidator<ServiceDto>
{
    public ServiceDtoValidator()
    {
        RuleFor(x => x.Name)
            .NotEmpty()
            .WithMessage("Hizmet adı zorunludur.")
            .MinimumLength(2)
            .WithMessage("Hizmet adı en az 2 karakter olmalıdır.")
            .MaximumLength(150)
            .WithMessage("Hizmet adı en fazla 150 karakter olabilir.");

        RuleFor(x => x.Price)
            .InclusiveBetween(0, 99999)
            .WithMessage("Fiyat 0 ile 99999 arasında olmalıdır.");

        RuleFor(x => x.DurationMinutes)
            .InclusiveBetween(5, 480)
            .WithMessage("Süre 5 ile 480 dakika arasında olmalıdır.");

        RuleFor(x => x.CategoryId).GreaterThan(0).WithMessage("Geçerli bir kategori seçiniz.");

        RuleFor(x => x.BusinessId).GreaterThan(0).WithMessage("Geçerli bir işletme seçiniz.");

        RuleFor(x => x.Description)
            .MaximumLength(1000)
            .WithMessage("Açıklama en fazla 1000 karakter olabilir.");
    }
}
