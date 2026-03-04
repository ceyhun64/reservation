using api.DTOs;
using FluentValidation;

namespace api.Validators;

public class ProviderDtoValidator : AbstractValidator<ProviderDto>
{
    public ProviderDtoValidator()
    {
        RuleFor(x => x.Title)
            .NotEmpty().WithMessage("Ünvan zorunludur.")
            .MinimumLength(2).WithMessage("Ünvan en az 2 karakter olmalıdır.")
            .MaximumLength(150).WithMessage("Ünvan en fazla 150 karakter olabilir.");

        RuleFor(x => x.Bio)
            .NotEmpty().WithMessage("Biyografi zorunludur.")
            .MaximumLength(2000).WithMessage("Biyografi en fazla 2000 karakter olabilir.");
    }
}