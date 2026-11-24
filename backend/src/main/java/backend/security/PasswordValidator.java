package backend.security;

import java.nio.charset.StandardCharsets;

import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;

public class PasswordValidator implements ConstraintValidator<ValidPassword, String> {
    private int minimumCharacters;

    @Override
    public void initialize(ValidPassword annotation) {
        minimumCharacters = annotation.minCharacters();
    }

    @Override
    public boolean isValid(String value, ConstraintValidatorContext context) {
        return value != null && !value.isBlank() && value.indexOf('\0') < 0
                && value.codePointCount(0, value.length()) >= minimumCharacters
                && value.getBytes(StandardCharsets.UTF_8).length <= 72;
    }
}
