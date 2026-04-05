<?php

namespace App\Http\Controllers\api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Hospital;
use App\Models\User;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class HospitalController extends Controller
{
    public function index()
    {
        $user = auth()->user();
        if (!$user) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        // Super Admin sees all hospitals; Admins see their own hospital
        if ($user->isSuperAdmin()) {
            $hospitals = Hospital::orderBy('name')->get();
        } elseif ($user->isAdmin()) {
            $hospitals = Hospital::where('id', $user->hospital_id)->get();
        } else {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        return response()->json(['status'=>'success','data'=>$hospitals]);
    }

    // Public listing used by patients
    public function publicIndex()
    {
        $user = auth()->user();
        if ($user && ($user->isSuperAdmin() || $user->isAdmin())) {
            // return admin view
            return $this->index();
        }

        $hospitals = Hospital::where('status', 'active')->orderBy('name')->get();
        return response()->json([
            'status' => 'success',
            'data' => $hospitals
        ]);
    }

    public function store(Request $request)
    {
        $user = auth()->user();
        if (!$user || !$user->isSuperAdmin()) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        // Require hospital data and admin user data
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'email' => 'nullable|email|unique:hospitals,email',
            'phone' => 'nullable|string|max:20',
            'address' => 'nullable|string|max:255',
            'city' => 'nullable|string|max:100',
            'state' => 'nullable|string|max:100',
            'country' => 'nullable|string|max:100',
            'postal_code' => 'nullable|string|max:20',
            'description' => 'nullable|string',
            // admin user details
            'admin_name' => 'required|string|max:255',
            'admin_email' => 'required|email|unique:users,email',
            'admin_password' => 'required|string|min:6',
        ]);

        if ($validator->fails()) {
            return response()->json(['status'=>'error','errors'=>$validator->errors()], 422);
        }

        // Create hospital and admin user in a transaction
        try {
            $result = DB::transaction(function () use ($request) {
                // Generate unique slug
                $baseSlug = Str::slug($request->name);
                $slug = $baseSlug;
                $counter = 1;
                while (Hospital::withTrashed()->where('slug', $slug)->exists()) {
                    $slug = $baseSlug . '-' . $counter;
                    $counter++;
                }

                $hospital = Hospital::create([
                    'name' => $request->name,
                    'slug' => $slug,
                    'description' => $request->description ?? null,
                    'email' => $request->email ?? null,
                    'phone' => $request->phone ?? null,
                    'address' => $request->address ?? null,
                    'city' => $request->city ?? null,
                    'state' => $request->state ?? null,
                    'country' => $request->country ?? null,
                    'postal_code' => $request->postal_code ?? null,
                    'status' => $request->status ?? 'active',
                ]);

                $admin = User::create([
                    'name' => $request->admin_name,
                    'email' => $request->admin_email,
                    'password' => Hash::make($request->admin_password),
                    'role' => 'admin',
                    'hospital_id' => $hospital->id,
                    'identifier' => 'ADM'.Str::upper(Str::random(6)),
                ]);

                // set hospital admin relationship
                $hospital->admin_id = null; // default
                $hospital->save();

                // return both models
                return compact('hospital', 'admin');
            });

            // make sure admin_id is linked on hospital
            if (isset($result['admin']->id) && isset($result['hospital']->id)) {
                $h = $result['hospital'];
                $h->admin_id = $result['admin']->id;
                $h->save();
            }

            return response()->json([
                'status' => 'success',
                'message' => 'Hospital created successfully',
                'data' => [
                    'hospital' => $result['hospital'],
                    'admin' => $result['admin']
                ]
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to create hospital: ' . $e->getMessage(),
                'errors' => ['general' => [$e->getMessage()]]
            ], 422);
        }
    }

    public function show($id)
    {
        $user = auth()->user();
        $hospital = Hospital::findOrFail($id);

        // If unauthenticated, return public hospital info
        if (!$user) {
            return response()->json(['status' => 'success', 'hospital' => $hospital]);
        }

        // Super Admin can view any hospital; Admin can view their own hospital only
        if ($user->isSuperAdmin() || ($user->isAdmin() && $user->hospital_id == $hospital->id)) {
            return response()->json(['status'=>'success','hospital'=>$hospital]);
        }

        return response()->json(['message' => 'Unauthorized'], 403);
    }

    // Public show for unauthenticated users
    public function publicShow($id)
    {
        $hospital = Hospital::with(['departments.doctors.user', 'admins'])->find($id);
        
        if (!$hospital) {
            return response()->json(['status' => 'error', 'message' => 'Hospital not found'], 404);
        }

        // Get the main admin (first admin user)
        $admin = $hospital->admins->first();

        // Format departments with doctors
        $departmentsWithDoctors = $hospital->departments->map(function ($dept) {
            return [
                'id' => $dept->id,
                'name' => $dept->name,
                'description' => $dept->description,
                'head_doctor' => $dept->head_doctor,
                'total_beds' => $dept->total_beds,
                'available_beds' => $dept->available_beds,
                'status' => $dept->status,
                'doctors' => $dept->doctors->map(function ($doc) {
                    return [
                        'id' => $doc->id,
                        'user_id' => $doc->user_id,
                        'name' => $doc->user->name ?? 'Unknown',
                        'email' => $doc->user->email ?? null,
                        'specialization' => $doc->specialization,
                        'qualification' => $doc->qualification,
                        'experience_years' => $doc->experience_years,
                        'consultation_fee' => $doc->consultation_fee,
                        'department_id' => $doc->department_id,
                    ];
                })
            ];
        });

        return response()->json([
            'status' => 'success',
            'hospital' => $hospital,
            'admin' => $admin ? [
                'name' => $admin->name,
                'email' => $admin->email,
                'identifier' => $admin->identifier,
            ] : null,
            'departments' => $departmentsWithDoctors
        ]);
    }

    public function update(Request $request, $id)
    {
        $user = auth()->user();
        if (!$user) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $hospital = Hospital::findOrFail($id);

        // Only Super Admin or the hospital's Admin can update
        if (!($user->isSuperAdmin() || ($user->isAdmin() && $user->hospital_id == $hospital->id))) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $validator = Validator::make($request->all(), [
            'name' => 'sometimes|required|string|max:255',
            'email' => 'nullable|email|unique:hospitals,email,'.$id,
            'phone' => 'nullable|string|max:20',
            'address' => 'nullable|string|max:255',
            'city' => 'nullable|string|max:100',
            'state' => 'nullable|string|max:100',
            'country' => 'nullable|string|max:100',
            'postal_code' => 'nullable|string|max:20',
            'description' => 'nullable|string',
            'status' => 'sometimes|required|in:active,inactive',
            'admin_email' => 'nullable|email|unique:hospitals,admin_email,'.$id,
            'image' => 'nullable|file|mimes:jpeg,png,jpg,gif,webp,avif|max:2048',
        ]);

        if ($validator->fails()) {
            return response()->json(['status'=>'error','errors'=>$validator->errors()], 422);
        }

        // Handle image upload
        if ($request->hasFile('image')) {
            // Delete old image if exists
            if ($hospital->image && \Storage::disk('public')->exists($hospital->image)) {
                \Storage::disk('public')->delete($hospital->image);
            }
            
            $imagePath = $request->file('image')->store('hospitals', 'public');
            $hospital->image = $imagePath;
        }

        $hospital->update($request->only([
            'name',
            'description',
            'email',
            'phone',
            'address',
            'city',
            'state',
            'country',
            'postal_code',
            'status',
            'admin_email'
        ]));
        
        $hospital->save();

        return response()->json(['status'=>'success','hospital'=>$hospital]);
    }

    public function destroy($id)
    {
        $user = auth()->user();
        if (!$user || !$user->isSuperAdmin()) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $hospital = Hospital::findOrFail($id);

        try {
            DB::beginTransaction();

            // Delete related doctors and their user accounts
            $doctors = $hospital->doctors;
            foreach ($doctors as $doctor) {
                // Delete the doctor's user account (this will cascade delete the doctor)
                if ($doctor->user) {
                    $doctor->user->delete();
                }
            }

            // Delete admin user associated with this hospital
            User::where('hospital_id', $hospital->id)->where('role', 'admin')->delete();

            // Delete related departments
            $hospital->departments()->delete();

            // Delete the hospital
            $hospital->delete();

            DB::commit();

            return response()->json(['status'=>'success','message'=>'Hospital and all related data deleted successfully']);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to delete hospital: ' . $e->getMessage()
            ], 500);
        }
    }
}
