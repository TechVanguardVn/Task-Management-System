package backend.security;

import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;
import java.lang.annotation.ElementType;

import jakarta.validation.Constraint;
import jakarta.validation.Payload;

@Target({ElementType.FIELD, ElementType.PARAMETER, ElementType.RECORD_COMPONENT})
@Retention(RetentionPolicy.RUNTIME)
@Constraint(validatedBy = PasswordValidator.class)
public @interface ValidPassword {
    int minCharacters() default 12;
    String message() default "Password must have at least {minCharacters} characters, at most 72 UTF-8 bytes, and no NUL characters";
    Class<?>[] groups() default {};
    Class<? extends Payload>[] payload() default {};
}
