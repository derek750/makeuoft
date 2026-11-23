from django.db import models
from django.conf import settings
from django.core import validators
from django.contrib.auth import get_user_model
import uuid

User = get_user_model()


def _generate_team_code():
    team_code = uuid.uuid4().hex[:5].upper()
    while Team.objects.filter(team_code=team_code).exists():
        team_code = uuid.uuid4().hex[:5].upper()
    return team_code


class Team(models.Model):
    team_code = models.CharField(max_length=5, default=_generate_team_code, null=False)
    credits = models.IntegerField(null=False, default=settings.DEFAULT_CREDITS_AT_START)

    created_at = models.DateTimeField(auto_now_add=True, null=False)
    updated_at = models.DateTimeField(auto_now=True, null=False)

    project_description = models.CharField(max_length=500, null=True)

    def __str__(self):
        return self.team_code


class Profile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    team = models.ForeignKey(
        Team, related_name="profiles", on_delete=models.CASCADE, null=False
    )
    phone_number = models.CharField(
        max_length=20,
        null=False,
    )
    id_provided = models.BooleanField(default=False, null=False)
    attended = models.BooleanField(default=False, null=False)
    acknowledge_rules = models.BooleanField(default=False, null=False)
    e_signature = models.TextField(null=True)

    created_at = models.DateTimeField(auto_now_add=True, null=False)
    updated_at = models.DateTimeField(auto_now=True, null=False)

    def save(self, *args, **kwargs):
        if not getattr(self, "team", None):
            self.team = Team.objects.create()

        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.id} | {self.user.first_name} {self.user.last_name}"


class UserActivity(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    sign_in = models.DateTimeField(null=True, blank=True)
    lunch1 = models.DateTimeField(null=True, blank=True)
    dinner1 = models.DateTimeField(null=True, blank=True)
    breakfast2 = models.DateTimeField(null=True, blank=True)
    lunch2 = models.DateTimeField(null=True, blank=True)


# --- Public MLH interest form ---------------------------------------------
# A publicly accessible "register your interest" form shown on the landing
# page while official registration is closed (2027 dates TBD). It collects the
# 8 MLH-required fields + the 3 MLH agreement checkboxes. The field formats and
# checkbox wording mirror the gated registration.Application form so the two
# stay identical for MLH's review.

# Mirrors registration.models.Application.AGE_CHOICES
INTEREST_AGE_CHOICES = [
    (None, ""),
    (17, "17"),
    (18, "18"),
    (19, "19"),
    (20, "20"),
    (21, "21"),
    (22, "22"),
    (23, "22+"),
]

# Mirrors registration.models.Application.STUDY_LEVEL_CHOICES
INTEREST_STUDY_LEVEL_CHOICES = [
    (None, ""),
    (
        "post-secondary-2-years",
        "2 year Undergraduate University or community college program",
    ),
    ("post-secondary-3-or-more-years", "3+ year Undergraduate University program"),
    ("graduate", "Graduate University (Masters, Professional, Doctoral, etc)"),
    ("other", "Other"),
]

# ISO 3166-1 list of countries (Country of Residence), per MLH's required format.
_COUNTRY_NAMES = [
    "Afghanistan",
    "Albania",
    "Algeria",
    "Andorra",
    "Angola",
    "Antigua and Barbuda",
    "Argentina",
    "Armenia",
    "Australia",
    "Austria",
    "Azerbaijan",
    "Bahamas",
    "Bahrain",
    "Bangladesh",
    "Barbados",
    "Belarus",
    "Belgium",
    "Belize",
    "Benin",
    "Bhutan",
    "Bolivia",
    "Bosnia and Herzegovina",
    "Botswana",
    "Brazil",
    "Brunei",
    "Bulgaria",
    "Burkina Faso",
    "Burundi",
    "Cabo Verde",
    "Cambodia",
    "Cameroon",
    "Canada",
    "Central African Republic",
    "Chad",
    "Chile",
    "China",
    "Colombia",
    "Comoros",
    "Congo (Brazzaville)",
    "Congo (Kinshasa)",
    "Costa Rica",
    "Côte d'Ivoire",
    "Croatia",
    "Cuba",
    "Cyprus",
    "Czechia",
    "Denmark",
    "Djibouti",
    "Dominica",
    "Dominican Republic",
    "Ecuador",
    "Egypt",
    "El Salvador",
    "Equatorial Guinea",
    "Eritrea",
    "Estonia",
    "Eswatini",
    "Ethiopia",
    "Fiji",
    "Finland",
    "France",
    "Gabon",
    "Gambia",
    "Georgia",
    "Germany",
    "Ghana",
    "Greece",
    "Grenada",
    "Guatemala",
    "Guinea",
    "Guinea-Bissau",
    "Guyana",
    "Haiti",
    "Honduras",
    "Hungary",
    "Iceland",
    "India",
    "Indonesia",
    "Iran",
    "Iraq",
    "Ireland",
    "Israel",
    "Italy",
    "Jamaica",
    "Japan",
    "Jordan",
    "Kazakhstan",
    "Kenya",
    "Kiribati",
    "Kosovo",
    "Kuwait",
    "Kyrgyzstan",
    "Laos",
    "Latvia",
    "Lebanon",
    "Lesotho",
    "Liberia",
    "Libya",
    "Liechtenstein",
    "Lithuania",
    "Luxembourg",
    "Madagascar",
    "Malawi",
    "Malaysia",
    "Maldives",
    "Mali",
    "Malta",
    "Marshall Islands",
    "Mauritania",
    "Mauritius",
    "Mexico",
    "Micronesia",
    "Moldova",
    "Monaco",
    "Mongolia",
    "Montenegro",
    "Morocco",
    "Mozambique",
    "Myanmar",
    "Namibia",
    "Nauru",
    "Nepal",
    "Netherlands",
    "New Zealand",
    "Nicaragua",
    "Niger",
    "Nigeria",
    "North Korea",
    "North Macedonia",
    "Norway",
    "Oman",
    "Pakistan",
    "Palau",
    "Palestine",
    "Panama",
    "Papua New Guinea",
    "Paraguay",
    "Peru",
    "Philippines",
    "Poland",
    "Portugal",
    "Qatar",
    "Romania",
    "Russia",
    "Rwanda",
    "Saint Kitts and Nevis",
    "Saint Lucia",
    "Saint Vincent and the Grenadines",
    "Samoa",
    "San Marino",
    "Sao Tome and Principe",
    "Saudi Arabia",
    "Senegal",
    "Serbia",
    "Seychelles",
    "Sierra Leone",
    "Singapore",
    "Slovakia",
    "Slovenia",
    "Solomon Islands",
    "Somalia",
    "South Africa",
    "South Korea",
    "South Sudan",
    "Spain",
    "Sri Lanka",
    "Sudan",
    "Suriname",
    "Sweden",
    "Switzerland",
    "Syria",
    "Taiwan",
    "Tajikistan",
    "Tanzania",
    "Thailand",
    "Timor-Leste",
    "Togo",
    "Tonga",
    "Trinidad and Tobago",
    "Tunisia",
    "Turkey",
    "Turkmenistan",
    "Tuvalu",
    "Uganda",
    "Ukraine",
    "United Arab Emirates",
    "United Kingdom",
    "United States",
    "Uruguay",
    "Uzbekistan",
    "Vanuatu",
    "Vatican City",
    "Venezuela",
    "Vietnam",
    "Yemen",
    "Zambia",
    "Zimbabwe",
    "Other",
]
INTEREST_COUNTRY_CHOICES = [(None, "")] + [(name, name) for name in _COUNTRY_NAMES]


class InterestSubmission(models.Model):
    first_name = models.CharField(max_length=30, null=False)
    last_name = models.CharField(max_length=30, null=False)
    email = models.EmailField(null=False)
    age = models.PositiveIntegerField(choices=INTEREST_AGE_CHOICES, null=False)
    phone_number = models.CharField(
        max_length=20,
        null=False,
        validators=[
            validators.RegexValidator(
                r"^\+?\d[\d\s()-]{7,}$",
                message="Enter a valid phone number.",
            )
        ],
    )
    school = models.CharField(max_length=255, null=False)
    study_level = models.CharField(
        max_length=50,
        help_text="Current level of study",
        choices=INTEREST_STUDY_LEVEL_CHOICES,
        null=False,
    )
    country = models.CharField(
        max_length=255, choices=INTEREST_COUNTRY_CHOICES, null=False
    )

    # The 3 MLH checkboxes. Help-text wording mirrors
    # registration.models.Application verbatim.
    conduct_agree = models.BooleanField(
        help_text="I have read and agree to the "
        '<a href="https://github.com/MLH/mlh-policies/blob/main/code-of-conduct.md" rel="noopener noreferrer" target="_blank">MLH Code of Conduct</a>.',
        blank=False,
        null=False,
        default=False,
    )
    logistics_agree = models.BooleanField(
        help_text="I authorize you to share my application/registration information with Major League Hacking"
        " for event administration, ranking, and administration (including the creation of linked accounts on MLH and "
        '<a href="https://dev.to" rel="noopener noreferrer" target="_blank">DEV</a>) in line with the '
        '<a href="https://github.com/MLH/mlh-policies/blob/main/privacy-policy.md" rel="noopener noreferrer" target="_blank">MLH Privacy Policy</a>. '
        "I further agree to the terms of both the "
        '<a href="https://github.com/MLH/mlh-policies/blob/main/contest-terms.md" rel="noopener noreferrer" target="_blank">MLH Contest Terms and Conditions</a>'
        " and the "
        '<a href="https://github.com/MLH/mlh-policies/blob/main/privacy-policy.md" rel="noopener noreferrer" target="_blank">MLH Privacy Policy</a>.',
        blank=False,
        null=False,
        default=False,
    )
    email_agree = models.BooleanField(
        help_text="I authorize MLH and DEV to send me occasional emails about relevant events, career opportunities, and community announcements.",
        blank=True,
        null=True,
        default=False,
    )

    created_at = models.DateTimeField(auto_now_add=True, null=False)

    def __str__(self):
        return f"{self.first_name} {self.last_name} <{self.email}>"
