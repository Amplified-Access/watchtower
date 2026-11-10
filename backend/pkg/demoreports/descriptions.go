package demoreports

import (
	"math/rand"
	"strings"
)

// A description is three sentences: what happened, a detail a witness would
// add, and what has happened since. Each part is picked separately, so a few
// dozen sentences per type make thousands of different reports.
// {place} becomes the town's name.
type templates struct {
	events    []string
	details   []string
	followUps []string
}

var byType = map[string]templates{
	"Election Irregularities": {
		events: []string{
			"Voters at a polling station in {place} were turned away after being told their names were missing from the register, although they hold valid voter cards.",
			"Ballot papers were found already marked before voting began at a primary school polling centre in {place}.",
			"Party agents in {place} reported they were barred from observing the counting of votes at their polling station.",
			"Polling materials arrived more than four hours late at several stations on the outskirts of {place}, and some voters left without voting.",
			"Residents in {place} reported people being transported in from outside the ward to vote, some holding several voter cards.",
			"The results form posted outside a tallying centre in {place} did not match the figures announced at the constituency level.",
			"Cash and food were handed out to voters queuing at a polling station in {place} by people wearing a candidate's colours.",
			"The biometric voter identification kits at several polling stations in {place} stopped working and officials continued without them.",
			"Voters in {place} said a polling official was instructing elderly voters which candidate to choose.",
			"A ballot box was removed from a polling station in {place} before counting began and returned about an hour later.",
			"Several people in {place} reported being threatened with losing their market stalls if they did not vote for a particular candidate.",
			"Observers in {place} recorded more votes cast at one station than the number of voters registered there.",
		},
		details: []string{
			"Witnesses said the presiding officer refused to record their complaint in the polling station diary.",
			"Photos of the results form were taken by an observer before it was taken down.",
			"Security officers present at the station did not intervene.",
			"The voters affected said they had checked their registration details by SMS a week earlier.",
			"At least two party agents signed a statement describing what they saw.",
			"Most of those turned away were young first-time voters.",
			"The incident lasted about forty minutes and voting continued afterwards.",
			"Several voters recorded short videos on their phones.",
		},
		followUps: []string{
			"A complaint has been lodged with the electoral commission.",
			"Local election observers have asked for the results from this station to be audited.",
			"The electoral commission's district office says it is looking into the matter.",
			"No official response has been given so far.",
			"Residents are asking for a recount at the affected stations.",
			"The candidate's agents have said they will petition the results.",
		},
	},
	"Abuse of office": {
		events: []string{
			"A land registry official in {place} is demanding payments of up to five times the official fee before issuing title deeds.",
			"Residents in {place} say a local administrator is allocating relief food only to households that support him politically.",
			"A district officer in {place} reportedly used a council vehicle and driver for a family wedding over a whole weekend.",
			"Traders in {place} report that council enforcement officers are confiscating goods and returning them only after an unofficial payment.",
			"A hospital administrator in {place} is said to be giving jobs to relatives without advertising the positions.",
			"Applicants for national identity cards in {place} say they are asked for a fee that does not exist before their forms are processed.",
			"A police commander in {place} allegedly ordered officers to guard a private construction site owned by a politician.",
			"A school head in {place} is reported to be charging parents an admission fee for places in a free public school.",
			"Business owners in {place} say a licensing officer only renews permits for those who pay him directly.",
			"A council official in {place} allegedly approved building plans on land set aside for a public playground.",
			"Residents of {place} report that a ward administrator is threatening to withhold bursaries from families who criticised him at a public meeting.",
			"A water utility manager in {place} is said to be disconnecting households that refuse to pay an extra monthly charge to his staff.",
		},
		details: []string{
			"Several residents described the same demand independently.",
			"Those who complained say they were told their applications had been lost.",
			"The payments are made in cash or by mobile money to a personal number.",
			"The practice has reportedly been going on for several months.",
			"People who refuse are told to come back another day, sometimes for weeks.",
			"A former employee confirmed the account to a local community group.",
			"Receipts are not issued for the extra payments.",
			"Neighbours say they are afraid to complain publicly.",
		},
		followUps: []string{
			"A complaint has been filed with the anti-corruption authority.",
			"Community leaders have asked the district authorities to investigate.",
			"The official has not responded to requests for comment.",
			"The matter has been raised with the area member of parliament.",
			"Residents plan to present a petition at the next public forum.",
			"A local civil society group is collecting further testimony.",
		},
	},
	"Public demonstrations": {
		events: []string{
			"Hundreds of residents marched through central {place} to protest a sharp rise in fuel and food prices.",
			"Students from a university in {place} blocked a main road to protest an increase in tuition fees.",
			"Traders in {place} closed their shops and gathered outside council offices to protest new market levies.",
			"Residents of an informal settlement in {place} protested planned evictions without notice or compensation.",
			"Motorcycle taxi riders in {place} staged a demonstration against a ban on operating in the town centre.",
			"Health workers in {place} held a peaceful march over months of unpaid salaries.",
			"Residents in {place} protested outside a police station demanding answers over the death of a young man in custody.",
			"Teachers in {place} gathered at the education office to protest delayed promotions and allowances.",
			"Farmers in {place} protested the late payment for crops delivered to the national grain board.",
			"Residents of {place} blocked a highway for several hours over a lack of clean water in the area for three weeks.",
			"Women's groups in {place} marched to demand action on a series of attacks on women in the area.",
			"A crowd gathered in {place} to protest the arrest of a local journalist.",
		},
		details: []string{
			"!Police used tear gas to disperse the crowd.",
			"The protest remained peaceful and ended in the afternoon.",
			"Several people were arrested and taken to a nearby police station.",
			"Protesters carried placards and sang as they marched.",
			"Shops along the route stayed closed for most of the day.",
			"!Police fired live rounds in the air, according to witnesses.",
			"Organisers said they had notified the police in advance as required.",
			"!Some protesters were beaten with batons as the crowd was dispersed.",
		},
		followUps: []string{
			"Organisers say they will continue the protests until their demands are met.",
			"Local leaders have called for dialogue with the protesters.",
			"Those arrested are expected to appear in court this week.",
			"Human rights groups have condemned the use of force.",
			"The local authorities have promised to meet a delegation of protesters.",
			"Calm returned to the area by evening.",
		},
	},
	"Community petitions": {
		events: []string{
			"Residents of {place} have collected signatures for a petition demanding the repair of a road that becomes impassable in the rains.",
			"Parents in {place} are petitioning the district to build more classrooms at an overcrowded primary school.",
			"Residents of {place} have petitioned the council over uncollected rubbish that has piled up for weeks.",
			"A petition from {place} asks the health ministry to staff a newly built health centre that has never opened.",
			"Traders in {place} have submitted a petition against the relocation of their market to the edge of town.",
			"Residents of {place} are petitioning for street lighting after a rise in muggings at night.",
			"Fishing communities near {place} have petitioned against a factory discharging waste into the lake.",
			"A group of youths in {place} have petitioned for an open-air sports ground to be protected from land grabbers.",
			"Residents of {place} have petitioned the water authority over frequent and unannounced supply cuts.",
			"Families in {place} have petitioned for a footbridge after children were swept away crossing a river on the way to school.",
			"Residents of {place} are petitioning against a quarry operating close to homes without an environmental licence.",
			"Persons with disabilities in {place} have petitioned for public offices to be made accessible.",
		},
		details: []string{
			"More than a thousand residents have signed so far.",
			"The petition was presented at a public meeting attended by the ward representative.",
			"Residents say earlier complaints over the past two years received no response.",
			"Community leaders delivered the petition to the local council.",
			"Signatures were collected door to door over two weekends.",
			"Residents shared photographs documenting the problem.",
			"A local church and mosque helped organise the signature drive.",
			"The petition sets out a deadline for a response.",
		},
		followUps: []string{
			"The local council has referred the petition to a committee.",
			"Officials have promised an inspection visit.",
			"Residents are still waiting for a response.",
			"The member of parliament has said the issue will be raised in the next budget.",
			"Community members plan a follow-up meeting next month.",
			"A response from the relevant office is expected within thirty days.",
		},
	},
	"Police misconduct": {
		events: []string{
			"Officers at a roadblock outside {place} are reported to be demanding bribes from motorists and threatening to impound vehicles.",
			"!A young man in {place} says he was beaten by officers during a night patrol and held overnight without charge.",
			"Residents of {place} report police raiding homes at night without warrants during a crackdown on illegal brewing.",
			"A street vendor in {place} says officers confiscated her goods and demanded payment for their return.",
			"!Witnesses in {place} say police assaulted a group of youths gathered outside a shop and arrested them for loitering.",
			"A woman in {place} reports that officers refused to record her complaint of domestic violence and sent her home.",
			"Family members in {place} say a relative has been held at a police station for five days without being taken to court.",
			"Motorcycle taxi riders in {place} accuse traffic officers of daily extortion at a busy junction.",
			"!Residents of {place} report that officers shot at a suspect fleeing on foot through a crowded market.",
			"A journalist in {place} says police seized his phone and deleted footage he had taken of an arrest.",
			"Witnesses in {place} say officers in plain clothes bundled a man into an unmarked vehicle.",
			"!Residents in {place} report police enforcing a curfew by beating people found on the streets after dark.",
		},
		details: []string{
			"The officers involved did not identify themselves.",
			"!The victim was later treated at a local health centre.",
			"Several witnesses gave consistent accounts of what happened.",
			"The incident was partly recorded on a bystander's phone.",
			"Those detained say they were released only after paying cash.",
			"Neighbours say this is not the first such incident in the area.",
			"No occurrence book entry was made for the arrest.",
			"The family was not told where the person was being held.",
		},
		followUps: []string{
			"A complaint has been filed with the police oversight authority.",
			"Human rights monitors are following up with the family.",
			"The station commander has said the matter is under investigation.",
			"A lawyer has been engaged to seek the person's release.",
			"Residents are calling for the officers to be transferred.",
			"No action has been taken against the officers so far.",
		},
	},
	"Misuse of public funds": {
		events: []string{
			"A road in {place} that was budgeted and paid for last financial year has not been built, residents report.",
			"A dispensary in {place} reported as complete in official records stands half-built and abandoned.",
			"Residents of {place} say a borehole paid for from the ward development fund has never produced water.",
			"Medicines delivered to a public hospital in {place} are reportedly being sold at private pharmacies nearby.",
			"A classroom block in {place} built last year is already cracking, and parents question how the contract was awarded.",
			"Payroll records seen by staff in {place} list workers who have never reported to the office.",
			"Bursary funds in {place} were reportedly paid to students who are not enrolled at any school.",
			"A market shed in {place} was paid for twice in the district's records but only built once.",
			"Relief food meant for drought-affected families in {place} was found being sold in a local shop.",
			"Fuel allocated to ambulances in {place} is said to be diverted, leaving patients without transport.",
			"A youth empowerment grant in {place} was reportedly shared among relatives of a local official.",
			"Streetlights paid for in {place} were installed without bulbs and have never been switched on.",
		},
		details: []string{
			"Residents compared the published budget with what they see on the ground.",
			"Community members took photos of the site as it stands.",
			"The contractor has not been seen at the site for months.",
			"A social audit by a local group documented the gap.",
			"The project signboard lists a completion date that passed long ago.",
			"Workers at the facility confirmed the account on condition of anonymity.",
			"The amount involved is said to run into millions.",
			"Requests for the project documents have gone unanswered.",
		},
		followUps: []string{
			"The matter has been reported to the auditor general's office.",
			"Residents have asked the local council to summon the officials responsible.",
			"The anti-corruption commission has been asked to investigate.",
			"Officials say an internal review is under way.",
			"Community members plan to raise the issue at the next budget hearing.",
			"No explanation has been offered so far.",
		},
	},
}

// generic covers incident types added later that have no sentences of their own.
var generic = templates{
	events: []string{
		"Residents of {place} reported an incident affecting their community.",
		"A community member in {place} reported a concern to local leaders.",
		"Several people in {place} described an incident they witnessed.",
	},
	details: []string{
		"Witnesses gave consistent accounts of what happened.",
		"Community members have documented the situation with photos.",
		"Residents say the problem has been going on for some time.",
	},
	followUps: []string{
		"The matter has been reported to the relevant authorities.",
		"Local leaders are following up.",
		"Residents are waiting for a response.",
	},
}

// hurtMark starts a sentence that says people were hurt. Only reports with
// one of those carry injuries, so a protest that "remained peaceful" never
// shows any.
const hurtMark = "!"

// pick returns a sentence and whether it says people were hurt.
func pick(rng *rand.Rand, options []string) (string, bool) {
	s := options[rng.Intn(len(options))]
	return strings.TrimPrefix(s, hurtMark), strings.HasPrefix(s, hurtMark)
}

// Report is the made-up part of a demonstration report.
type Report struct {
	Description string
	Injuries    int
	Fatalities  int
}

// NewReport writes a report of the given incident type from the given town.
// Types without sentences of their own get generic ones.
func NewReport(rng *rand.Rand, incidentType string, place string) Report {
	t, ok := byType[incidentType]
	if !ok {
		t = generic
	}
	event, eventHurt := pick(rng, t.events)
	detail, detailHurt := pick(rng, t.details)
	followUp, _ := pick(rng, t.followUps)

	r := Report{Description: strings.ReplaceAll(event+" "+detail+" "+followUp, "{place}", place)}
	if eventHurt || detailHurt {
		r.Injuries = 1 + rng.Intn(4)
		if incidentType == "Public demonstrations" {
			r.Injuries += rng.Intn(6)
		}
		if rng.Float64() < 0.04 {
			r.Fatalities = 1
		}
	}
	return r
}

// IsPlaceholder reports whether a description is one the old refresh cron
// wrote ("Weekly refresh report #3 — Nairobi"), which the top-up rewrites.
func IsPlaceholder(description string) bool {
	return strings.HasPrefix(description, "Weekly refresh report")
}
