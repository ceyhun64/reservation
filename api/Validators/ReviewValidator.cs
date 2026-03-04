using api.DTOs;
using FluentValidation;

namespace api.Validators;

public class ReviewCreateDtoValidator : AbstractValidator<ReviewCreateDto>
{
    public ReviewCreateDtoValidator()
    {
        RuleFor(x => x.AppointmentId).GreaterThan(0).WithMessage("Geçerli bir randevu seçiniz.");

        RuleFor(x => x.Rating)
            .InclusiveBetween(1, 5)
            .WithMessage("Puan 1 ile 5 arasında olmalıdır.");

        RuleFor(x => x.Comment)
            .MaximumLength(1000)
            .WithMessage("Yorum en fazla 1000 karakter olabilir.")
            .When(x => x.Comment is not null);
    }
}

public class ReviewReplyDtoValidator : AbstractValidator<ReviewReplyDto>
{
    public ReviewReplyDtoValidator()
    {
        RuleFor(x => x.Reply)
            .NotEmpty()
            .WithMessage("Yanıt zorunludur.")
            .MinimumLength(2)
            .WithMessage("Yanıt en az 2 karakter olmalıdır.")
            .MaximumLength(500)
            .WithMessage("Yanıt en fazla 500 karakter olabilir.");
    }
}
