using api.DTOs;
using FluentValidation;

namespace api.Validators;

public class AppointmentCreateDtoValidator : AbstractValidator<AppointmentCreateDto>
{
    public AppointmentCreateDtoValidator()
    {
        RuleFor(x => x.ProviderId)
            .GreaterThan(0).WithMessage("Geçerli bir Provider seçiniz.");

        RuleFor(x => x.ServiceId)
            .GreaterThan(0).WithMessage("Geçerli bir hizmet seçiniz.");

        RuleFor(x => x.TimeSlotId)
            .GreaterThan(0).WithMessage("Geçerli bir zaman dilimi seçiniz.");

        RuleFor(x => x.ReceiverNotes)
            .MaximumLength(500).WithMessage("Notlar en fazla 500 karakter olabilir.")
            .When(x => x.ReceiverNotes is not null);
    }
}

public class AppointmentUpdateStatusDtoValidator : AbstractValidator<AppointmentUpdateStatusDto>
{
    private static readonly string[] ValidActions = ["confirm", "reject", "complete", "noshow"];

    public AppointmentUpdateStatusDtoValidator()
    {
        RuleFor(x => x.Action)
            .NotEmpty().WithMessage("Aksiyon zorunludur.")
            .Must(a => ValidActions.Contains(a.ToLower()))
            .WithMessage("Geçerli aksiyonlar: confirm, reject, complete, noshow.");

        RuleFor(x => x.Reason)
            .MaximumLength(500).WithMessage("Neden en fazla 500 karakter olabilir.")
            .When(x => x.Reason is not null);
    }
}